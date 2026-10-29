import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/adminSession";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const settings = await prisma.platformSetting.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1 },
  });

  return NextResponse.json({
    platformName: settings.platformName,
    supportEmail: settings.supportEmail,
    baseCurrency: settings.baseCurrency,
  });
}

const UpdateSettingsSchema = z.object({
  platformName: z.string().trim().min(1).max(80).optional(),
  // Empty string clears it back to "not set"; omit the field to leave it alone.
  supportEmail: z.union([z.string().trim().email(), z.literal("")]).optional(),
});

// baseCurrency isn't editable here — changing it would desync every price
// already stored relative to it, so it's fixed at seed/setup time.
export async function PATCH(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = UpdateSettingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid settings payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const { platformName, supportEmail } = parsed.data;
  const settings = await prisma.platformSetting.upsert({
    where: { id: 1 },
    update: {
      ...(platformName !== undefined ? { platformName } : {}),
      ...(supportEmail !== undefined ? { supportEmail: supportEmail || null } : {}),
    },
    create: { id: 1, platformName: platformName ?? "LetsMeat", supportEmail: supportEmail || null },
  });

  return NextResponse.json({
    platformName: settings.platformName,
    supportEmail: settings.supportEmail,
    baseCurrency: settings.baseCurrency,
  });
}
