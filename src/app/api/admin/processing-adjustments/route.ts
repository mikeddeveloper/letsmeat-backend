import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/adminSession";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await prisma.processingAdjustment.findMany({ orderBy: { processingType: "asc" } });
  return NextResponse.json(rows.map((r) => ({ processingType: r.processingType, adjustmentPercent: r.adjustmentPercent })));
}
