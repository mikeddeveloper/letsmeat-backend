import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/adminSession";

// Flat, admin-only view of every part for price management — deliberately
// separate from /api/admin/catalog (the nested category→animal→part tree),
// which is shared shape-for-shape with /api/customer/catalog and shouldn't
// pick up admin-only fields like a raw `id`.
export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parts = await prisma.part.findMany({
    include: { animal: { include: { category: true } } },
    orderBy: [{ animal: { category: { name: "asc" } } }, { animal: { name: "asc" } }, { name: "asc" }],
  });

  return NextResponse.json(
    parts.map((part) => ({
      id: part.id,
      name: part.name,
      animalName: part.animal.name,
      categoryName: part.animal.category.name,
      basePrice: part.basePrice / 100,
      unit: part.unit,
      availability: part.availability,
    })),
  );
}
