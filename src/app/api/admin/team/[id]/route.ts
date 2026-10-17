import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/adminSession";

const UpdateRoleSchema = z.object({
  role: z.enum(["Super Admin", "Catalog Manager", "Support Lead", "Finance Admin"]),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "Super Admin") {
    return NextResponse.json({ error: "Only a Super Admin can change roles." }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = UpdateRoleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid role." }, { status: 400 });
  }

  const target = await prisma.adminUser.findUnique({ where: { id } });
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // A Super Admin can't demote themselves out of the only account that can
  // manage the team — avoids locking everyone out by accident.
  if (target.id === session.adminId && parsed.data.role !== "Super Admin") {
    const otherSuperAdmins = await prisma.adminUser.count({ where: { role: "Super Admin", id: { not: target.id } } });
    if (otherSuperAdmins === 0) {
      return NextResponse.json({ error: "You're the only Super Admin — promote someone else first." }, { status: 400 });
    }
  }

  const updated = await prisma.adminUser.update({ where: { id }, data: { role: parsed.data.role } });
  return NextResponse.json({ id: updated.id, name: updated.name, email: updated.email, role: updated.role, lastActiveAt: updated.lastActiveAt });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "Super Admin") {
    return NextResponse.json({ error: "Only a Super Admin can remove team members." }, { status: 403 });
  }

  const { id } = await params;
  if (id === session.adminId) {
    return NextResponse.json({ error: "You can't remove your own account." }, { status: 400 });
  }

  const target = await prisma.adminUser.findUnique({ where: { id } });
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.adminUser.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
