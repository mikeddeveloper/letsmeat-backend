import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/adminSession";
import { slugify } from "@/lib/slug";

const CreateAnimalSchema = z.object({
  name: z.string().trim().min(1).max(60),
  description: z.string().trim().max(300).optional(),
});

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug: categorySlug } = await params;
  const category = await prisma.animalCategory.findUnique({ where: { slug: categorySlug } });
  if (!category) return NextResponse.json({ error: "Category not found" }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = CreateAnimalSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid animal type payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const slug = slugify(parsed.data.name);
  if (!slug) return NextResponse.json({ error: "That name doesn't produce a usable slug." }, { status: 400 });

  const existing = await prisma.animal.findUnique({ where: { categoryId_slug: { categoryId: category.id, slug } } });
  if (existing) return NextResponse.json({ error: "An animal type with that name already exists in this category." }, { status: 409 });

  const animal = await prisma.animal.create({
    data: { categoryId: category.id, slug, name: parsed.data.name, description: parsed.data.description || null },
  });

  return NextResponse.json(
    { slug: animal.slug, name: animal.name, description: animal.description ?? "", parts: [] },
    { status: 201 },
  );
}
