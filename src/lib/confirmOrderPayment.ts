import "server-only";
import { prisma } from "@/lib/prisma";

type PaystackVerifyResponse = {
  status: boolean;
  data?: { status: string; amount: number; reference: string };
};

export type ConfirmResult =
  | { verified: true; orderNumber: string; placedAt: Date }
  | { verified: false; reason: string };

/**
 * The one place that actually marks an order paid — used by both the
 * browser-return callback (customer lands back on our site) and the
 * Paystack webhook (fires independently of the browser, so a closed tab
 * or lost connection right after paying doesn't leave a real payment
 * stuck as "unpaid" forever). Always re-checks with Paystack directly
 * rather than trusting whatever triggered the call, and cross-checks the
 * amount against what this specific order actually expects.
 */
export async function confirmOrderPayment(reference: string): Promise<ConfirmResult> {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    return { verified: false, reason: "Payments aren't configured." };
  }

  const order = await prisma.order.findUnique({ where: { ref: reference } });
  if (!order) {
    return { verified: false, reason: "Order not found." };
  }

  if (order.paidAt) {
    return { verified: true, orderNumber: order.ref, placedAt: order.placedAt };
  }

  const paystackRes = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secretKey}` },
  });
  const paystackData: PaystackVerifyResponse = await paystackRes.json();

  const verified =
    paystackRes.ok &&
    paystackData.status &&
    paystackData.data?.status === "success" &&
    paystackData.data.amount === order.totalAmount;

  if (!verified) {
    return { verified: false, reason: "Payment was not confirmed." };
  }

  const updated = await prisma.order.update({ where: { id: order.id }, data: { paidAt: new Date() } });
  return { verified: true, orderNumber: updated.ref, placedAt: updated.placedAt };
}
