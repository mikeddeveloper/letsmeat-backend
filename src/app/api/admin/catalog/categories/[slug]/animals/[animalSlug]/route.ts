import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/adminSession";

export async function DELETE(_request: Request, { params }: { params: Promise<{ slug: string; animalSlug: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug: categorySlug, animalSlug } = await params;
  const category = await prisma.animalCategory.findUnique({ where: { slug: categorySlug } });
  if (!category) return NextResponse.json({ error: "Category not found" }, { status: 404 });

  const animal = await prisma.animal.findUnique({
    where: { categoryId_slug: { categoryId: category.id, slug: animalSlug } },
    include: { parts: { include: { _count: { select: { orderItems: true } } } } },
  });
  if (!animal) return NextResponse.json({ error: "Animal type not found" }, { status: 404 });

  const orderedParts = animal.parts.filter((part) => part._count.orderItems > 0);
  if (orderedParts.length > 0) {
    return NextResponse.json(
      {
        error: `Can't delete "${animal.name}" — these cuts have been ordered before: ${orderedParts
          .map((p) => p.name)
          .join(", ")}. Remove the other cuts first, or set these to out of stock instead.`,
      },
      { status: 409 },
    );
  }

  await prisma.$transaction([
    prisma.part.deleteMany({ where: { animalId: animal.id } }),
    prisma.animal.delete({ where: { id: animal.id } }),
  ]);

  return NextResponse.json({ ok: true });
}
