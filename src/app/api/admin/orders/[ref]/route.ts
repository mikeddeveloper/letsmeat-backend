import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/adminSession";
import type { OrderStatus } from "@/generated/prisma/client";

export async function GET(_request: Request, { params }: { params: Promise<{ ref: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { ref } = await params;
  const order = await prisma.order.findUnique({
    where: { ref: decodeURIComponent(ref) },
    include: {
      customer: { select: { id: true, name: true, email: true, phone: true } },
      supplier: { select: { name: true } },
      items: { include: { part: { select: { name: true, unit: true } } } },
    },
  });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  return NextResponse.json({
    id: order.ref,
    status: order.status,
    totalAmount: order.totalAmount,
    itemsSummary: order.itemsSummary,
    placedAt: order.placedAt,
    paidAt: order.paidAt,
    customer: order.customer,
    supplierName: order.supplier?.name ?? "Unassigned",
    delivery: {
      name: order.deliveryName,
      phone: order.deliveryPhone,
      address: order.deliveryAddress,
      city: order.deliveryCity,
    },
    items: order.items.map((item) => ({
      name: item.part.name,
      quantity: item.quantity,
      unit: item.part.unit,
      weightKg: item.weightKg,
      condition: item.condition,
      processingType: item.processingType,
      price: item.price,
    })),
  });
}

const VALID_STATUSES: OrderStatus[] = ["pending", "in_progress", "delivered", "cancelled"];
const UpdateOrderSchema = z.object({ status: z.enum(["pending", "in_progress", "delivered", "cancelled"]) });

// Admins can move an order to any of these — cancel at any point before
// delivery, or override/complete manually since there's no courier app
// pushing status updates yet.
export async function PATCH(request: Request, { params }: { params: Promise<{ ref: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { ref } = await params;
  const body = await request.json().catch(() => null);
  const parsed = UpdateOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid status payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.order.findUnique({ where: { ref: decodeURIComponent(ref) } });
  if (!existing) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (existing.status === "delivered" || existing.status === "cancelled") {
    return NextResponse.json({ error: `Order is already ${existing.status} and can't be changed.` }, { status: 409 });
  }
  if (!VALID_STATUSES.includes(parsed.data.status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const order = await prisma.order.update({ where: { ref: existing.ref }, data: { status: parsed.data.status } });
  return NextResponse.json({ id: order.ref, status: order.status });
}
