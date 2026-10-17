import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/adminSession";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const currencies = await prisma.currency.findMany();
  const sorted = currencies.sort((a, b) => {
    if (a.status !== b.status) return a.status === "base" ? -1 : 1;
    return a.code.localeCompare(b.code);
  });
  return NextResponse.json(sorted);
}

const CreateCurrencySchema = z.object({
  code: z.string().trim().toUpperCase().length(3),
  symbol: z.string().trim().min(1).max(5),
  label: z.string().trim().min(1).max(60),
  rateToNgn: z.number().positive(),
});

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = CreateCurrencySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid currency payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.currency.findUnique({ where: { code: parsed.data.code } });
  if (existing) return NextResponse.json({ error: "That currency code already exists." }, { status: 409 });

  const currency = await prisma.currency.create({ data: { ...parsed.data, status: "live" } });
  return NextResponse.json(currency, { status: 201 });
}
