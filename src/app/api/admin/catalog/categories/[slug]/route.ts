import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/adminSession";

const UpdateCategorySchema = z.object({
  name: z.string().trim().min(1).max(60).optional(),
  description: z.string().trim().max(300).optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug } = await params;
  const body = await request.json().catch(() => null);
  const parsed = UpdateCategorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid category payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.animalCategory.findUnique({ where: { slug } });
  if (!existing) return NextResponse.json({ error: "Category not found" }, { status: 404 });

  const updated = await prisma.animalCategory.update({
    where: { slug },
    data: {
      ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
      ...(parsed.data.description !== undefined ? { description: parsed.data.description || null } : {}),
    },
  });

  return NextResponse.json({ slug: updated.slug, name: updated.name, description: updated.description ?? "" });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug } = await params;
  const category = await prisma.animalCategory.findUnique({
    where: { slug },
    include: { animals: { include: { parts: { include: { _count: { select: { orderItems: true } } } } } } },
  });
  if (!category) return NextResponse.json({ error: "Category not found" }, { status: 404 });

  const orderedParts = category.animals.flatMap((animal) => animal.parts).filter((part) => part._count.orderItems > 0);
  if (orderedParts.length > 0) {
    return NextResponse.json(
      {
        error: `Can't delete "${category.name}" — these cuts have been ordered before: ${orderedParts
          .map((p) => p.name)
          .join(", ")}. Remove the other animal types/cuts first, or set these to out of stock instead.`,
      },
      { status: 409 },
    );
  }

  const animalIds = category.animals.map((a) => a.id);
  await prisma.$transaction([
    prisma.part.deleteMany({ where: { animalId: { in: animalIds } } }),
    prisma.animal.deleteMany({ where: { categoryId: category.id } }),
    prisma.animalCategory.delete({ where: { id: category.id } }),
  ]);

  return NextResponse.json({ ok: true });
}
