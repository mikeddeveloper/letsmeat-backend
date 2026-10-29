import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/adminSession";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      orders: { orderBy: { placedAt: "desc" }, include: { supplier: { select: { name: true } } } },
      _count: { select: { supportTickets: true } },
    },
  });
  if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

  return NextResponse.json({
    id: customer.id,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    city: customer.city,
    status: customer.status,
    adminNote: customer.adminNote,
    joinedAt: customer.joinedAt,
    emailVerifiedAt: customer.emailVerifiedAt,
    supportTicketsCount: customer._count.supportTickets,
    orders: customer.orders.map((o) => ({
      id: o.ref,
      itemsSummary: o.itemsSummary,
      totalAmount: o.totalAmount,
      status: o.status,
      supplierName: o.supplier?.name ?? "Unassigned",
      placedAt: o.placedAt,
    })),
  });
}

const UpdateCustomerSchema = z.object({
  status: z.enum(["active", "suspended", "whitelisted", "blacklisted"]).optional(),
  adminNote: z.string().trim().max(2000).optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = UpdateCustomerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid customer payload", details: parsed.error.flatten() }, { status: 400 });
  }
  if (Object.keys(parsed.data).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const existing = await prisma.customer.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

  const customer = await prisma.customer.update({ where: { id }, data: parsed.data });

  return NextResponse.json({
    id: customer.id,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    city: customer.city,
    status: customer.status,
    adminNote: customer.adminNote,
    joinedAt: customer.joinedAt,
  });
}
