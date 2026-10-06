import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/adminSession";

export async function GET() {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ admin: null }, { status: 401 });
  }

  const admin = await prisma.adminUser.findUnique({ where: { id: session.adminId } });
  if (!admin) {
    return NextResponse.json({ admin: null }, { status: 401 });
  }

  return NextResponse.json({ admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role } });
}
