import { NextResponse } from "next/server";
import { CreateOrderSchema, UnknownCatalogItemError, createOrder } from "@/lib/createOrder";

// Guest checkout only — no customer auth exists yet, so orders are created
// against a Customer record upserted by phone number (the one stable
// identifier the checkout form actually collects; there's no email field).
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = CreateOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid order payload", details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const order = await createOrder(parsed.data);
    return NextResponse.json({ orderNumber: order.ref, placedAt: order.placedAt }, { status: 201 });
  } catch (err) {
    if (err instanceof UnknownCatalogItemError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }
}
