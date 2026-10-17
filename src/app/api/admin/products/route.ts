import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/adminSession";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const products = await prisma.adminProduct.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(
    products.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description ?? "",
      categoryLabel: p.categoryLabel,
      price: p.price / 100,
      unit: p.unit,
      imageUrl: p.imageUrl ?? "",
      availability: p.availability,
      isCutOfTheDay: p.isCutOfTheDay,
      createdAt: p.createdAt,
    })),
  );
}

const CreateAdminProductSchema = z.object({
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(400).optional(),
  categoryLabel: z.string().trim().min(1).max(60),
  price: z.number().positive(), // naira, converted to kobo below
  unit: z.enum(["kg", "unit"]),
  imageUrl: z.string().trim().url().max(500).optional().or(z.literal("")),
  availability: z.enum(["in_stock", "limited", "out_of_stock"]).default("in_stock"),
  isCutOfTheDay: z.boolean().default(false),
});

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = CreateAdminProductSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid product payload", details: parsed.error.flatten() }, { status: 400 });
  }
  const { price, imageUrl, ...rest } = parsed.data;

  const product = await prisma.$transaction(async (tx) => {
    // Only one product can hold the Cut of the Day spot — clear it off
    // whichever row currently has it before this one can claim it.
    if (rest.isCutOfTheDay) {
      await tx.adminProduct.updateMany({ where: { isCutOfTheDay: true }, data: { isCutOfTheDay: false } });
    }
    return tx.adminProduct.create({
      data: { ...rest, price: Math.round(price * 100), imageUrl: imageUrl || null },
    });
  });

  return NextResponse.json(
    {
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
    },
    { status: 201 },
  );
}
