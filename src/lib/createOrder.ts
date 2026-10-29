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

// The client submits `subtotal` separately from each item's `price`, with
// nothing tying the two together — a request could carry real items but an
// arbitrary subtotal, and that subtotal is what gets charged via Paystack
// (see payments/initialize). Rejecting any mismatch closes that gap without
// guessing at the storefront's full pricing formula (condition/processing
// adjustments aren't modeled here) — each line's `price` is still
// client-supplied and not re-priced against the catalog.
export class SubtotalMismatchError extends Error {
  constructor(
    public submitted: number,
    public computed: number,
  ) {
    super(`Submitted subtotal (${submitted}) doesn't match the sum of item prices (${computed}).`);
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
  // item.price is already the line's total (see OrderItemSchema above), not
  // a per-unit rate — summing it directly matches how OrderItem.price is
  // stored and displayed elsewhere (no separate quantity multiplication).
  const computedSubtotal = items.reduce((sum, item) => sum + item.price, 0);
  if (Math.abs(computedSubtotal - subtotal) > 0.01) {
    throw new SubtotalMismatchError(subtotal, computedSubtotal);
  }

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
      totalAmount: Math.round(computedSubtotal * 100),
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
