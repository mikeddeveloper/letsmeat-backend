import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/adminSession";

const UpdateAdjustmentSchema = z.object({
  adjustmentPercent: z.number().min(-100).max(500).nullable(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ processingType: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { processingType } = await params;
  const body = await request.json().catch(() => null);
  const parsed = UpdateAdjustmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid adjustment payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const decoded = decodeURIComponent(processingType);
  const existing = await prisma.processingAdjustment.findUnique({ where: { processingType: decoded } });
  if (!existing) return NextResponse.json({ error: "Processing type not found" }, { status: 404 });

  const row = await prisma.processingAdjustment.update({
    where: { processingType: decoded },
    data: { adjustmentPercent: parsed.data.adjustmentPercent },
  });

  return NextResponse.json({ processingType: row.processingType, adjustmentPercent: row.adjustmentPercent });
}
