import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/adminSession";
import { dailySeries, ordersInRange, rangeWindow, sumRevenue, type DateRange, type RangeOrder } from "@/lib/adminAnalytics";

function isDateRange(value: string | null): value is DateRange {
  return value === "today" || value === "7d" || value === "30d" || value === "90d";
}

function statusCounts(orders: RangeOrder[]) {
  const counts = { pending: 0, in_progress: 0, delivered: 0, cancelled: 0 };
  for (const order of orders) counts[order.status] += 1;
  return counts;
}

export async function GET(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const rangeParam = url.searchParams.get("range");
  const range: DateRange = isDateRange(rangeParam) ? rangeParam : "30d";
  const { since, until, previousSince, previousUntil } = rangeWindow(range);

  const [orders, previousOrders, activeSuppliers, newSuppliers, limitedStockParts, openOverdueTickets, pendingVerifications] =
    await Promise.all([
      ordersInRange(since, until),
      ordersInRange(previousSince, previousUntil),
      prisma.supplier.count({ where: { status: "active" } }),
      prisma.supplier.count({ where: { joinedAt: { gte: since, lte: until } } }),
      prisma.part.count({ where: { availability: "limited" } }),
      // No SLA/"response target" field exists on SupportTicket yet — this is
      // a reasonable stand-in (open tickets no one has touched in 48h+)
      // rather than a fabricated exact figure.
      prisma.supportTicket.count({ where: { status: "open", createdAt: { lte: new Date(Date.now() - 48 * 60 * 60 * 1000) } } }),
      prisma.verificationSubmission.count({ where: { decision: null } }),
    ]);

  const gmv = sumRevenue(orders);
  const gmvPrev = sumRevenue(previousOrders);
  const ordersCount = orders.length;
  const ordersCountPrev = previousOrders.length;
  const aov = ordersCount > 0 ? gmv / ordersCount : 0;
  const aovPrev = ordersCountPrev > 0 ? gmvPrev / ordersCountPrev : 0;
  const activeCustomers = new Set(orders.map((o) => o.customerId)).size;
  const activeCustomersPrev = new Set(previousOrders.map((o) => o.customerId)).size;

  const counts = statusCounts(orders);
  const countsPrev = statusCounts(previousOrders);
  const fulfilmentRate = ordersCount > 0 ? counts.delivered / ordersCount : 0;
  const fulfilmentRatePrev = ordersCountPrev > 0 ? countsPrev.delivered / ordersCountPrev : 0;
  const cancelledRate = ordersCount > 0 ? counts.cancelled / ordersCount : 0;
  const cancelledRatePrev = ordersCountPrev > 0 ? countsPrev.cancelled / ordersCountPrev : 0;

  // Stuck-in-progress is a "right now" signal, not range-scoped — an order
  // placed before the window started can still be stuck today.
  const stuckOrders = await prisma.order.count({
    where: { status: "in_progress", placedAt: { lte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
  });

  const animalRevenue = new Map<string, number>();
  const partRevenue = new Map<string, { name: string; animal: string; revenue: number }>();
  for (const order of orders) {
    for (const item of order.items) {
      const lineRevenue = (item.price * item.quantity) / 100;
      const animalName = item.part.animal.name;
      animalRevenue.set(animalName, (animalRevenue.get(animalName) ?? 0) + lineRevenue);
      const existing = partRevenue.get(item.partId);
      partRevenue.set(item.partId, {
        name: item.part.name,
        animal: animalName,
        revenue: (existing?.revenue ?? 0) + lineRevenue,
      });
    }
  }

  return NextResponse.json({
    range,
    kpis: {
      gmv,
      gmvPrev,
      orders: ordersCount,
      ordersPrev: ordersCountPrev,
      aov,
      aovPrev,
      activeCustomers,
      activeCustomersPrev,
      activeSuppliers,
      newSuppliers,
      fulfilmentRate,
      fulfilmentRatePrev,
      cancelledRate,
      cancelledRatePrev,
    },
    dailySeries: dailySeries(orders, since, until),
    ordersByStatus: [
      { status: "pending", count: counts.pending },
      { status: "in_progress", count: counts.in_progress },
      { status: "delivered", count: counts.delivered },
      { status: "cancelled", count: counts.cancelled },
    ],
    salesByAnimal: Array.from(animalRevenue.entries())
      .map(([name, revenue]) => ({ name, revenue }))
      .sort((a, b) => b.revenue - a.revenue),
    topParts: Array.from(partRevenue.values()).sort((a, b) => b.revenue - a.revenue),
    health: { stuckOrders, pendingVerifications, limitedStockParts, overdueTickets: openOverdueTickets },
  });
}
