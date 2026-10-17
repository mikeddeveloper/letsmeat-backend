import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminSession";
import { dailySeries, ordersInRange, sumRevenue } from "@/lib/adminAnalytics";

// Fixed 12-day window to match the Reports page's own framing ("Revenue —
// last 12 days"), independent of the Dashboard's selectable range.
const WINDOW_DAYS = 12;

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const until = new Date();
  const since = new Date(until.getTime() - (WINDOW_DAYS - 1) * 24 * 60 * 60 * 1000);
  const todayStart = new Date(Date.UTC(until.getUTCFullYear(), until.getUTCMonth(), until.getUTCDate()));

  const [orders, todayOrders] = await Promise.all([ordersInRange(since, until), ordersInRange(todayStart, until)]);

  const revenueByCategory = new Map<string, number>();
  for (const order of orders) {
    for (const item of order.items) {
      const categoryName = item.part.animal.category.name;
      const lineRevenue = (item.price * item.quantity) / 100;
      revenueByCategory.set(categoryName, (revenueByCategory.get(categoryName) ?? 0) + lineRevenue);
    }
  }
  const categoryTotal = Array.from(revenueByCategory.values()).reduce((sum, v) => sum + v, 0);

  return NextResponse.json({
    dailyRevenue: dailySeries(orders, since, until),
    revenueToday: sumRevenue(todayOrders),
    revenueByCategory: Array.from(revenueByCategory.entries())
      .map(([name, revenue]) => ({ name, revenue, sharePct: categoryTotal > 0 ? (revenue / categoryTotal) * 100 : 0 }))
      .sort((a, b) => b.revenue - a.revenue),
  });
}
