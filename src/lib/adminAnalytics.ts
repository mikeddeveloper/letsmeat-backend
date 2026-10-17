import "server-only";
import { prisma } from "@/lib/prisma";

export type DateRange = "today" | "7d" | "30d" | "90d";

/** [since, until] for the requested range, plus the equal-length window right
 *  before it (for the "vs previous period" deltas the dashboard shows). */
export function rangeWindow(range: DateRange, now = new Date()) {
  const until = now;
  let since: Date;
  switch (range) {
    case "today":
      since = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      break;
    case "7d":
      since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "90d":
      since = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case "30d":
    default:
      since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
  }
  const spanMs = until.getTime() - since.getTime();
  const previousSince = new Date(since.getTime() - spanMs);
  const previousUntil = since;
  return { since, until, previousSince, previousUntil };
}

function dayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

/** Every calendar day from `since` to `until` inclusive, so a day with zero
 *  orders still shows up as a real zero in a trend instead of a gap. */
export function eachDay(since: Date, until: Date): string[] {
  const days: string[] = [];
  const cursor = new Date(Date.UTC(since.getUTCFullYear(), since.getUTCMonth(), since.getUTCDate()));
  const end = new Date(Date.UTC(until.getUTCFullYear(), until.getUTCMonth(), until.getUTCDate()));
  while (cursor <= end) {
    days.push(dayKey(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
}

export async function ordersInRange(since: Date, until: Date) {
  return prisma.order.findMany({
    where: { placedAt: { gte: since, lte: until } },
    include: {
      items: { include: { part: { include: { animal: { include: { category: true } } } } } },
    },
    orderBy: { placedAt: "asc" },
  });
}

export type RangeOrder = Awaited<ReturnType<typeof ordersInRange>>[number];

/** Daily { date, revenue, orders } series covering every day in the window,
 *  zero-filled — the raw numbers behind both the revenue chart and the KPI
 *  sparklines; the admin app does its own pixel/SVG scaling from this. */
export function dailySeries(orders: RangeOrder[], since: Date, until: Date) {
  const byDay = new Map<string, { revenue: number; orders: number }>();
  for (const day of eachDay(since, until)) byDay.set(day, { revenue: 0, orders: 0 });
  for (const order of orders) {
    const key = dayKey(order.placedAt);
    const bucket = byDay.get(key);
    if (bucket) {
      bucket.revenue += order.totalAmount;
      bucket.orders += 1;
    }
  }
  return Array.from(byDay.entries()).map(([date, v]) => ({ date, revenue: v.revenue / 100, orders: v.orders }));
}

export function sumRevenue(orders: RangeOrder[]) {
  return orders.reduce((sum, o) => sum + o.totalAmount, 0) / 100;
}

export const ORDER_STATUSES = ["pending", "in_progress", "delivered", "cancelled"] as const;
