import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/adminSession";
import { slugify } from "@/lib/slug";

const CreateCategorySchema = z.object({
  name: z.string().trim().min(1).max(60),
  description: z.string().trim().max(300).optional(),
});

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = CreateCategorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid category payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const slug = slugify(parsed.data.name);
  if (!slug) return NextResponse.json({ error: "That name doesn't produce a usable slug." }, { status: 400 });

  const existing = await prisma.animalCategory.findUnique({ where: { slug } });
  if (existing) return NextResponse.json({ error: "A category with that name already exists." }, { status: 409 });

  const category = await prisma.animalCategory.create({
    data: { slug, name: parsed.data.name, description: parsed.data.description || null },
  });

  return NextResponse.json(
    { slug: category.slug, name: category.name, description: category.description ?? "", animals: [] },
    { status: 201 },
  );
}
