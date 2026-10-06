import { NextResponse } from "next/server";
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
