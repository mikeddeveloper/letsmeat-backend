import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/adminSession";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const customers = await prisma.customer.findMany({
    orderBy: { joinedAt: "desc" },
    include: { _count: { select: { orders: true } } },
  });

  return NextResponse.json(
    customers.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      city: c.city,
      ordersCount: c._count.orders,
      status: c.status,
      joinedAt: c.joinedAt,
    })),
  );
}
