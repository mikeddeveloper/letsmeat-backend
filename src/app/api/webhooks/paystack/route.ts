import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { confirmOrderPayment } from "@/lib/confirmOrderPayment";

type PaystackWebhookEvent = { event: string; data?: { reference?: string } };

function isValidSignature(rawBody: string, signature: string | null, secretKey: string): boolean {
  if (!signature) return false;
  const expected = createHmac("sha512", secretKey).update(rawBody).digest("hex");
  const expectedBuf = Buffer.from(expected, "utf8");
  const signatureBuf = Buffer.from(signature, "utf8");
  if (expectedBuf.length !== signatureBuf.length) return false;
  return timingSafeEqual(expectedBuf, signatureBuf);
}

// Independent of the customer's browser making it back to /checkout/callback
// — this is what actually catches a closed tab or lost connection right
// after a real, successful payment, so the order doesn't stay "unpaid"
// forever just because the redirect never completed. Must be registered
// as the webhook URL in the Paystack dashboard to ever actually fire.
export async function POST(request: Request) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json({ error: "Payments aren't configured." }, { status: 500 });
  }

  // Signature is computed over the exact raw bytes Paystack sent — reading
  // via request.json() first would make that unrecoverable, so the raw
  // text is read before any parsing.
  const rawBody = await request.text();
  if (!isValidSignature(rawBody, request.headers.get("x-paystack-signature"), secretKey)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event: PaystackWebhookEvent = JSON.parse(rawBody);
  if (event.event === "charge.success" && event.data?.reference) {
    await confirmOrderPayment(event.data.reference);
  }

  // Always 200 once the signature's valid, even if this particular event
  // type wasn't one we act on — anything else makes Paystack retry
  // needlessly.
  return NextResponse.json({ received: true });
}
