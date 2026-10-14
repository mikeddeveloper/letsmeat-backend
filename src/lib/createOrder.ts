import "server-only";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const OrderItemSchema = z.object({
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

export const OrderDeliverySchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  address: z.string().min(1),
  city: z.string().min(1),
});

export const CreateOrderSchema = z.object({
  items: z.array(OrderItemSchema).min(1),
  subtotal: z.number().nonnegative(),
  delivery: OrderDeliverySchema,
});

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;

export class UnknownCatalogItemError extends Error {
  constructor(public item: z.infer<typeof OrderItemSchema>) {
    super(`Unknown catalog item: ${item.categorySlug}/${item.animalSlug}/${item.partSlug}`);
  }
}

const ORDER_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateOrderRef() {
  let code = "";
  for (let i = 0; i < 6; i++) code += ORDER_CODE_CHARS[Math.floor(Math.random() * ORDER_CODE_CHARS.length)];
  return `LM-${code}`;
}

/**
 * Shared by guest order creation and the Paystack checkout flow — both
 * need the exact same catalog-resolution, customer-upsert and ref-
 * generation logic, just triggered from different places.
 */
export async function createOrder({ items, subtotal, delivery }: CreateOrderInput) {
  const resolvedItems: Array<{ partId: string; item: z.infer<typeof OrderItemSchema> }> = [];
  for (const item of items) {
    const part = await prisma.part.findFirst({
      where: {
        slug: item.partSlug,
        animal: { slug: item.animalSlug, category: { slug: item.categorySlug } },
      },
      select: { id: true },
    });
    if (!part) throw new UnknownCatalogItemError(item);
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

  return prisma.order.create({
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
}
