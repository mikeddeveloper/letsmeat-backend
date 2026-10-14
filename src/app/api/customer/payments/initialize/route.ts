import { NextResponse } from "next/server";
import { CreateOrderSchema, UnknownCatalogItemError, createOrder } from "@/lib/createOrder";
import { getPublicWebOrigin } from "@/lib/publicOrigin";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

type PaystackInitResponse = {
  status: boolean;
  message: string;
  data?: { authorization_url: string; reference: string };
};

// Guest checkout has no email field — Paystack requires one anyway, so this
// is a stable, deterministic placeholder tied to the phone number (not used
// to actually contact anyone, just satisfies the API).
function placeholderEmail(phone: string) {
  return `${phone.replace(/[^0-9]/g, "")}@guest.letsmeat.app`;
}

export async function POST(request: Request) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json({ error: "Payments aren't configured." }, { status: 500 });
  }

  const ip = getClientIp(request);
  if (!checkRateLimit(`payments-init:ip:${ip}`, 10, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many attempts — wait a few minutes and try again." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = CreateOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid order payload", details: parsed.error.flatten() }, { status: 400 });
  }

  let order;
  try {
    order = await createOrder(parsed.data);
  } catch (err) {
    if (err instanceof UnknownCatalogItemError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }

  const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: placeholderEmail(order.deliveryPhone ?? parsed.data.delivery.phone),
      amount: order.totalAmount,
      reference: order.ref,
      callback_url: `${getPublicWebOrigin()}/checkout/callback`,
    }),
  });
  const paystackData: PaystackInitResponse = await paystackRes.json();

  if (!paystackRes.ok || !paystackData.status || !paystackData.data) {
    return NextResponse.json({ error: paystackData.message || "Could not start payment." }, { status: 502 });
  }

  return NextResponse.json({
    authorizationUrl: paystackData.data.authorization_url,
    reference: paystackData.data.reference,
  });
}
