import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public, unauthenticated. apps/web-next falls back to its own hardcoded
// copy if this is unreachable, so a missing row here is fine either way —
// upsert just guarantees row 1 exists rather than 500ing on first read.
export async function GET() {
  const content = await prisma.landingContent.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1 },
  });

  return NextResponse.json({
    heroEyebrow: content.heroEyebrow,
    heroHeadline: content.heroHeadline,
    heroSubheadline: content.heroSubheadline,
    heroCtaLabel: content.heroCtaLabel,
  });
}
