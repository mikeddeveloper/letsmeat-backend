import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

// Public, unauthenticated — the "become a supplier" lead-capture form.
const JoinWaitlistSchema = z.object({
  name: z.string().trim().min(1).max(80),
  shopName: z.string().trim().min(1).max(80),
  address: z.string().trim().min(1).max(200),
  phone: z.string().trim().min(7).max(20),
  category: z.string().trim().max(60).optional(),
});

// Normalizes "0801..." and "+234801..." (or "234801...") to the same key so
// the same person can't join twice just by switching how they type their
// number. Anything that isn't a recognizable Nigerian-style number falls
// back to its stripped digits, which still catches exact re-submissions.
function normalizePhoneKey(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("234")) return digits;
  if (digits.startsWith("0")) return `234${digits.slice(1)}`;
  return digits;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = JoinWaitlistSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please fill in every field.", details: parsed.error.flatten() }, { status: 400 });
  }

  const phoneKey = normalizePhoneKey(parsed.data.phone);

  try {
    const entry = await prisma.supplierWaitlistEntry.create({
      data: { ...parsed.data, category: parsed.data.category || null, phoneKey },
    });
    const position = await prisma.supplierWaitlistEntry.count({ where: { createdAt: { lte: entry.createdAt } } });

    return NextResponse.json({ id: entry.id, name: entry.name, position }, { status: 201 });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ error: "This phone number is already on the waitlist." }, { status: 409 });
    }
    throw err;
  }
}
