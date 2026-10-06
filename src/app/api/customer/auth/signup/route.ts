import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const SignupSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
});

// Same upsert-by-phone identity checkout's order route already uses — phone
// is the one stable identifier the form actually collects (no email field,
// no password here). This doesn't send or verify a real OTP; it just turns
// the sign-up form's submit into a real Customer row instead of a fake
// setTimeout, so the account genuinely exists afterward.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = SignupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid signup payload", details: parsed.error.flatten() }, { status: 400 });
  }
  const { name, phone } = parsed.data;

  const customer = await prisma.customer.upsert({
    where: { phone },
    update: { name },
    create: { name, phone },
  });

  return NextResponse.json(
    { id: customer.id, name: customer.name, phone: customer.phone, joinedAt: customer.joinedAt },
    { status: 201 },
  );
}
