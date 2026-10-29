import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public, unauthenticated — matches the shape apps/web-next's static
// src/lib/data/catalog.ts already exports (ProteinCategory[]), so the
// frontend can swap its data source without reshaping consumers.
export async function GET() {
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
          basePrice: part.basePrice / 100, // kobo -> naira
          unit: part.unit,
          conditions: part.conditions,
          processing: part.processing,
          availability: part.availability,
        })),
      })),
    })),
  );
}
