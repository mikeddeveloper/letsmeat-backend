import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/adminSession";

const UpdateCurrencySchema = z.object({
  rateToNgn: z.number().positive(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { code } = await params;
  const body = await request.json().catch(() => null);
  const parsed = UpdateCurrencySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid currency payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.currency.findUnique({ where: { code: code.toUpperCase() } });
  if (!existing) return NextResponse.json({ error: "Currency not found" }, { status: 404 });
  // The base currency is always 1:1 with itself — every other rate is
  // expressed relative to it, so letting an admin edit it away from 1 would
  // silently corrupt every other currency's conversion.
  if (existing.status === "base") {
    return NextResponse.json({ error: "The base currency's rate can't be changed." }, { status: 400 });
  }

  const currency = await prisma.currency.update({
    where: { code: existing.code },
    data: { rateToNgn: parsed.data.rateToNgn },
  });

  return NextResponse.json(currency);
}
