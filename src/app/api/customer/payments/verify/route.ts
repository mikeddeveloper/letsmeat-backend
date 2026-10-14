import { NextResponse } from "next/server";
import { z } from "zod";
import { confirmOrderPayment } from "@/lib/confirmOrderPayment";

const VerifySchema = z.object({ reference: z.string().min(1) });

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = VerifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const result = await confirmOrderPayment(parsed.data.reference);
  if (!result.verified) {
    return NextResponse.json(result, { status: 402 });
  }
  return NextResponse.json(result);
}
