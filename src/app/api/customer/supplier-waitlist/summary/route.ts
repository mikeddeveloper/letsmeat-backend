import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public, unauthenticated — just enough for the "N suppliers already
// joined" social-proof strip (first names only, never phone/address/full
// name past the first word).
export async function GET() {
  const [total, recent] = await Promise.all([
    prisma.supplierWaitlistEntry.count(),
    prisma.supplierWaitlistEntry.findMany({ take: 8, orderBy: { createdAt: "desc" }, select: { name: true } }),
  ]);

  return NextResponse.json({
    total,
    firstNames: recent.map((r) => r.name.trim().split(/\s+/)[0]),
  });
}
