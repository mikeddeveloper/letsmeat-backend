import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/adminSession";

// Same tree shape as /api/customer/catalog (so both apps' consumers stay in
// sync), just auth-gated and under the admin namespace.
export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const categories = await prisma.animalCategory.findMany({
    include: { animals: { include: { parts: true }, orderBy: { name: "asc" } } },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(
    categories.map((category) => ({
      slug: category.slug,
      name: category.name,
      description: category.description ?? "",
      animals: category.animals.map((animal) => ({
        slug: animal.slug,
        name: animal.name,
        description: animal.description ?? "",
        parts: animal.parts.map((part) => ({
          slug: part.slug,
          name: part.name,
          basePrice: part.basePrice / 100,
          unit: part.unit,
          conditions: part.conditions,
          processing: part.processing,
          availability: part.availability,
        })),
      })),
    })),
  );
}
