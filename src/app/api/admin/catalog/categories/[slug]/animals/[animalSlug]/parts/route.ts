import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/adminSession";
import { slugify } from "@/lib/slug";

const CreatePartSchema = z.object({
  name: z.string().trim().min(1).max(60),
  basePrice: z.number().positive(), // naira, converted to kobo below
  unit: z.enum(["kg", "unit"]),
  conditions: z.array(z.enum(["fresh", "frozen"])).min(1),
  processing: z.array(z.string().trim().min(1)).default([]),
  availability: z.enum(["in_stock", "limited", "out_of_stock"]).default("in_stock"),
});

export async function POST(request: Request, { params }: { params: Promise<{ slug: string; animalSlug: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug: categorySlug, animalSlug } = await params;
  const category = await prisma.animalCategory.findUnique({ where: { slug: categorySlug } });
  if (!category) return NextResponse.json({ error: "Category not found" }, { status: 404 });

  const animal = await prisma.animal.findUnique({ where: { categoryId_slug: { categoryId: category.id, slug: animalSlug } } });
  if (!animal) return NextResponse.json({ error: "Animal type not found" }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = CreatePartSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid cut payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const slug = slugify(parsed.data.name);
  if (!slug) return NextResponse.json({ error: "That name doesn't produce a usable slug." }, { status: 400 });

  const existing = await prisma.part.findUnique({ where: { animalId_slug: { animalId: animal.id, slug } } });
  if (existing) return NextResponse.json({ error: "A cut with that name already exists for this animal." }, { status: 409 });

  const part = await prisma.part.create({
    data: {
      animalId: animal.id,
      slug,
      name: parsed.data.name,
      basePrice: Math.round(parsed.data.basePrice * 100),
      unit: parsed.data.unit,
      conditions: parsed.data.conditions,
      processing: parsed.data.processing,
      availability: parsed.data.availability,
    },
  });

  return NextResponse.json(
    {
      slug: part.slug,
      name: part.name,
      basePrice: part.basePrice / 100,
      unit: part.unit,
      conditions: part.conditions,
      processing: part.processing,
      availability: part.availability,
    },
    { status: 201 },
  );
}
