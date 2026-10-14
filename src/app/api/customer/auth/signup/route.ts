import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { CUSTOMER_SESSION_COOKIE, createCustomerSessionToken, customerSessionCookieOptions } from "@/lib/customerSession";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { sendOnboardingEmail } from "@/lib/onboardingEmail";

const SignupSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  // Optional — the form doesn't require it, so most sign-ups still won't
  // have one. Only used to send the onboarding email below.
  email: z.string().email().optional(),
});

// Same upsert-by-phone identity checkout's order route already uses — phone
// is the one stable identifier the form requires (no password here). This
// doesn't send or verify a real OTP; it just turns the sign-up form's
// submit into a real Customer row instead of a fake setTimeout, so the
// account genuinely exists afterward.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = SignupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid signup payload", details: parsed.error.flatten() }, { status: 400 });
  }
  const { name, phone, email } = parsed.data;

  // upsert-by-phone means this endpoint can log someone into an EXISTING
  // account too, not just create new ones — same sensitivity as sign-in,
  // same two-way limit (one machine trying many numbers / many machines
  // targeting one number).
  const ip = getClientIp(request);
  const withinIpLimit = checkRateLimit(`signup:ip:${ip}`, 10, 10 * 60 * 1000);
  const withinPhoneLimit = checkRateLimit(`signup:phone:${phone}`, 5, 15 * 60 * 1000);
  if (!withinIpLimit || !withinPhoneLimit) {
    return NextResponse.json({ error: "Too many attempts — wait a few minutes and try again." }, { status: 429 });
  }

  const existedBefore = await prisma.customer.findUnique({ where: { phone }, select: { id: true } });

  let customer;
  try {
    customer = await prisma.customer.upsert({
      where: { phone },
      update: { name, ...(email ? { email } : {}) },
      create: { name, phone, ...(email ? { email } : {}) },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ error: "That email is already linked to another account." }, { status: 409 });
    }
    throw err;
  }

  // Best-effort — a slow or down mail server should never block the
  // account from actually being created, same principle as checkout never
  // blocking a sale on a side-channel hiccup. Only for genuinely new
  // sign-ups with an email, not every re-submit of an existing phone.
  if (!existedBefore && email) {
    sendOnboardingEmail({ to: email, name }).catch(() => {});
  }

  const token = await createCustomerSessionToken({ customerId: customer.id, phone });
  const response = NextResponse.json(
    { id: customer.id, name: customer.name, phone: customer.phone, joinedAt: customer.joinedAt },
    { status: 201 },
  );
  response.cookies.set(CUSTOMER_SESSION_COOKIE, token, customerSessionCookieOptions);
  return response;
}
