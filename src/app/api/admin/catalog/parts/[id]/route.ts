import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/adminSession";

const UpdatePartSchema = z.object({
  basePrice: z.number().positive().optional(), // naira, converted to kobo below
  availability: z.enum(["in_stock", "limited", "out_of_stock"]).optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = UpdatePartSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid price payload", details: parsed.error.flatten() }, { status: 400 });
  }
  if (Object.keys(parsed.data).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const existing = await prisma.part.findUnique({ where: { id }, include: { animal: { include: { category: true } } } });
  if (!existing) return NextResponse.json({ error: "Part not found" }, { status: 404 });

  const { basePrice, ...rest } = parsed.data;
  const part = await prisma.part.update({
    where: { id },
    data: { ...rest, ...(basePrice !== undefined ? { basePrice: Math.round(basePrice * 100) } : {}) },
    include: { animal: { include: { category: true } } },
  });

  return NextResponse.json({
    id: part.id,
    name: part.name,
    animalName: part.animal.name,
    categoryName: part.animal.category.name,
    basePrice: part.basePrice / 100,
    unit: part.unit,
    availability: part.availability,
  });
}
