import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/adminSession";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const team = await prisma.adminUser.findMany({ orderBy: { createdAt: "asc" } });

  return NextResponse.json(
    team.map((member) => ({
      id: member.id,
      name: member.name,
      email: member.email,
      role: member.role,
      lastActiveAt: member.lastActiveAt,
    })),
  );
}
