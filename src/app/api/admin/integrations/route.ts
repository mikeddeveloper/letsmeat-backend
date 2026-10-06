import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/adminSession";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const integrations = await prisma.integration.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(integrations.map((i) => ({ name: i.name, category: i.category, status: i.status })));
}
