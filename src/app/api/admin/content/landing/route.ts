import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/adminSession";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

const UpdateLandingContentSchema = z.object({
  heroEyebrow: z.string().trim().min(1).max(80),
  heroHeadline: z.string().trim().min(1).max(160),
  heroSubheadline: z.string().trim().min(1).max(400),
  heroCtaLabel: z.string().trim().min(1).max(40),
});

export async function PATCH(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = UpdateLandingContentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid landing content payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const content = await prisma.landingContent.upsert({
    where: { id: 1 },
    update: parsed.data,
    create: { id: 1, ...parsed.data },
  });

  return NextResponse.json({
    heroEyebrow: content.heroEyebrow,
    heroHeadline: content.heroHeadline,
    heroSubheadline: content.heroSubheadline,
    heroCtaLabel: content.heroCtaLabel,
  });
}
