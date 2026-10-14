import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { CUSTOMER_SESSION_COOKIE, createCustomerSessionToken, customerSessionCookieOptions } from "@/lib/customerSession";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

const SigninSchema = z.object({ phone: z.string().min(1) });

// No SMS/OTP provider wired up yet, so this is a deliberate, agreed interim:
// sign-in just looks the phone number up and logs it in, no code sent or
// verified. That makes this the single most sensitive endpoint in the app —
// knowing a phone number is enough to get in — so it's rate-limited two
// ways: per IP (catches one machine scripting through many numbers) and
// per phone (catches many IPs/a botnet all targeting one specific number).
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = SigninSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid sign-in payload", details: parsed.error.flatten() }, { status: 400 });
  }
  const { phone } = parsed.data;

  const ip = getClientIp(request);
  const withinIpLimit = checkRateLimit(`signin:ip:${ip}`, 10, 10 * 60 * 1000);
  const withinPhoneLimit = checkRateLimit(`signin:phone:${phone}`, 5, 15 * 60 * 1000);
  if (!withinIpLimit || !withinPhoneLimit) {
    return NextResponse.json({ error: "Too many attempts — wait a few minutes and try again." }, { status: 429 });
  }

  const customer = await prisma.customer.findUnique({ where: { phone } });
  if (!customer) {
    return NextResponse.json({ error: "No account found with that number — try creating one instead." }, { status: 404 });
  }

  const token = await createCustomerSessionToken({ customerId: customer.id, phone });
  const response = NextResponse.json({ id: customer.id, name: customer.name, phone: customer.phone, joinedAt: customer.joinedAt });
  response.cookies.set(CUSTOMER_SESSION_COOKIE, token, customerSessionCookieOptions);
  return response;
}
