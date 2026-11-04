import { NextResponse } from "next/server";
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

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = JoinWaitlistSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please fill in every field.", details: parsed.error.flatten() }, { status: 400 });
  }

  const entry = await prisma.supplierWaitlistEntry.create({
    data: { ...parsed.data, category: parsed.data.category || null },
  });
  const position = await prisma.supplierWaitlistEntry.count({ where: { createdAt: { lte: entry.createdAt } } });

  return NextResponse.json({ id: entry.id, name: entry.name, position }, { status: 201 });
}
