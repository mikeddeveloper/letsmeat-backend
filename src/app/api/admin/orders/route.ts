import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/adminSession";
import type { OrderStatus } from "@/generated/prisma/client";

const VALID_STATUSES: OrderStatus[] = ["pending", "in_progress", "delivered", "cancelled"];

export async function GET(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const statusParam = new URL(request.url).searchParams.get("status");
  const status = VALID_STATUSES.includes(statusParam as OrderStatus) ? (statusParam as OrderStatus) : undefined;

  const orders = await prisma.order.findMany({
    where: status ? { status } : undefined,
    orderBy: { placedAt: "desc" },
    include: { customer: { select: { name: true } }, supplier: { select: { name: true } } },
  });

  return NextResponse.json({
    total: orders.length,
    items: orders.map((o) => ({
      id: o.ref,
      customerName: o.customer.name,
      supplierName: o.supplier?.name ?? "Unassigned",
      itemsSummary: o.itemsSummary,
      placedAt: o.placedAt,
      status: o.status,
      totalAmount: o.totalAmount,
    })),
  });
}
