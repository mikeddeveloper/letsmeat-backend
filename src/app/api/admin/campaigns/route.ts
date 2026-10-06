import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/adminSession";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const campaigns = await prisma.campaign.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json(
    campaigns.map((c) => ({ id: c.id, name: c.name, audience: c.audience, status: c.status, reach: c.reach })),
  );
}
