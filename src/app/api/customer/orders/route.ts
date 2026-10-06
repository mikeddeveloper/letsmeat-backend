import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const ItemSchema = z.object({
  categorySlug: z.string(),
  animalSlug: z.string(),
  partSlug: z.string(),
  name: z.string(),
  condition: z.enum(["fresh", "frozen"]).optional(),
  processingType: z.string().optional(),
  weightKg: z.number().positive().optional(),
  price: z.number().nonnegative(), // naira, whole — total for this line's configuration
  quantity: z.number().min(1),
});

const OrderSchema = z.object({
  items: z.array(ItemSchema).min(1),
  subtotal: z.number().nonnegative(),
  delivery: z.object({
    name: z.string().min(1),
    phone: z.string().min(1),
    address: z.string().min(1),
    city: z.string().min(1),
  }),
});

const ORDER_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateOrderRef() {
  let code = "";
  for (let i = 0; i < 6; i++) code += ORDER_CODE_CHARS[Math.floor(Math.random() * ORDER_CODE_CHARS.length)];
  return `LM-${code}`;
}

// Guest checkout only — no customer auth exists yet, so orders are created
// against a Customer record upserted by phone number (the one stable
// identifier the checkout form actually collects; there's no email field).
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = OrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid order payload", details: parsed.error.flatten() }, { status: 400 });
  }
  const { items, subtotal, delivery } = parsed.data;

  const resolvedItems: Array<{ partId: string; item: z.infer<typeof ItemSchema> }> = [];
  for (const item of items) {
    const part = await prisma.part.findFirst({
      where: {
        slug: item.partSlug,
        animal: { slug: item.animalSlug, category: { slug: item.categorySlug } },
      },
      select: { id: true },
    });
    if (!part) {
      return NextResponse.json(
        { error: `Unknown catalog item: ${item.categorySlug}/${item.animalSlug}/${item.partSlug}` },
        { status: 400 },
      );
    }
    resolvedItems.push({ partId: part.id, item });
  }

  const customer = await prisma.customer.upsert({
    where: { phone: delivery.phone },
    update: { name: delivery.name, city: delivery.city },
    create: { name: delivery.name, phone: delivery.phone, city: delivery.city },
  });

  const itemsSummary = items.map((i) => `${i.name}${i.weightKg ? ` · ${i.weightKg}kg` : ""}`).join(", ");

  let ref = generateOrderRef();
  for (let attempt = 0; attempt < 5; attempt++) {
    const exists = await prisma.order.findUnique({ where: { ref }, select: { id: true } });
    if (!exists) break;
    ref = generateOrderRef();
  }

  const order = await prisma.order.create({
    data: {
      ref,
      customerId: customer.id,
      totalAmount: Math.round(subtotal * 100),
      itemsSummary,
      deliveryName: delivery.name,
      deliveryPhone: delivery.phone,
      deliveryAddress: delivery.address,
      deliveryCity: delivery.city,
      items: {
        create: resolvedItems.map(({ partId, item }) => ({
          partId,
          quantity: item.quantity,
          price: Math.round(item.price * 100),
          condition: item.condition,
          processingType: item.processingType,
          weightKg: item.weightKg,
        })),
      },
    },
  });

  return NextResponse.json({ orderNumber: order.ref, placedAt: order.placedAt }, { status: 201 });
}
