import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/adminSession";

// Point-in-time operational view — unlike /dashboard/analytics this isn't
// scoped to a selected date range, it's always "right now".
export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [stuckOrders, limitedStockParts, overdueTickets, pendingVerifications, recentOrders] = await Promise.all([
    prisma.order.count({ where: { status: "in_progress", placedAt: { lte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } }),
    prisma.part.count({ where: { availability: "limited" } }),
    prisma.supportTicket.count({ where: { status: "open", createdAt: { lte: new Date(Date.now() - 48 * 60 * 60 * 1000) } } }),
    prisma.verificationSubmission.count({ where: { decision: null } }),
    prisma.order.findMany({
      take: 6,
      orderBy: { placedAt: "desc" },
      include: { customer: true, supplier: true },
    }),
  ]);

  return NextResponse.json({
    alerts: { stuckOrders, limitedStockParts, overdueTickets, pendingVerifications },
    recentOrders: recentOrders.map((order) => ({
      ref: order.ref,
      customerName: order.customer.name,
      supplierName: order.supplier?.name ?? null,
      amount: order.totalAmount / 100,
      status: order.status,
      placedAt: order.placedAt,
    })),
  });
}
