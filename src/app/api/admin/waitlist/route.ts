import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/adminSession";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const entries = await prisma.supplierWaitlistEntry.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(
    entries.map((e) => ({
      id: e.id,
      name: e.name,
      shopName: e.shopName,
      address: e.address,
      phone: e.phone,
      category: e.category,
      contacted: e.contacted,
      createdAt: e.createdAt,
    })),
  );
}
