import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/adminSession";

const UpdateAdminProductSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  description: z.string().trim().max(400).optional(),
  categoryLabel: z.string().trim().min(1).max(60).optional(),
  price: z.number().positive().optional(), // naira, converted to kobo below
  unit: z.enum(["kg", "unit"]).optional(),
  imageUrl: z.string().trim().url().max(500).optional().or(z.literal("")),
  availability: z.enum(["in_stock", "limited", "out_of_stock"]).optional(),
  isCutOfTheDay: z.boolean().optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = UpdateAdminProductSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid product payload", details: parsed.error.flatten() }, { status: 400 });
  }
  const { price, imageUrl, ...rest } = parsed.data;

  const existing = await prisma.adminProduct.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  const product = await prisma.$transaction(async (tx) => {
    if (rest.isCutOfTheDay) {
      await tx.adminProduct.updateMany({ where: { isCutOfTheDay: true, id: { not: id } }, data: { isCutOfTheDay: false } });
    }
    return tx.adminProduct.update({
      where: { id },
      data: {
        ...rest,
        ...(price !== undefined ? { price: Math.round(price * 100) } : {}),
        ...(imageUrl !== undefined ? { imageUrl: imageUrl || null } : {}),
      },
    });
  });

  return NextResponse.json({
    id: product.id,
    name: product.name,
    description: product.description ?? "",
    categoryLabel: product.categoryLabel,
    price: product.price / 100,
    unit: product.unit,
    imageUrl: product.imageUrl ?? "",
    availability: product.availability,
    isCutOfTheDay: product.isCutOfTheDay,
    createdAt: product.createdAt,
  });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.adminProduct.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  await prisma.adminProduct.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
