import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public, unauthenticated — the admin-entered products (incl. whichever one
// is currently Cut of the Day) that sit alongside, not inside, the static
// catalog apps/web-next otherwise ships with. Out-of-stock items are still
// returned (same convention as the static catalog) so the frontend can
// decide how to show them rather than silently hiding them here.
export async function GET() {
  const products = await prisma.adminProduct.findMany({ orderBy: { createdAt: "desc" } });

  return NextResponse.json(
    products.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description ?? "",
      categoryLabel: p.categoryLabel,
      price: p.price / 100,
      unit: p.unit,
      imageUrl: p.imageUrl || null,
      availability: p.availability,
      isCutOfTheDay: p.isCutOfTheDay,
    })),
  );
}
