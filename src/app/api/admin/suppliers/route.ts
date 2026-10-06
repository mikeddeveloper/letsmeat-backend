import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/adminSession";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const suppliers = await prisma.supplier.findMany({ orderBy: { joinedAt: "desc" } });

  return NextResponse.json(
    suppliers.map((s) => ({
      id: s.id,
      name: s.name,
      categories: s.categories,
      city: s.city,
      status: s.status,
      rating: s.rating,
      joinedAt: s.joinedAt,
    })),
  );
}
