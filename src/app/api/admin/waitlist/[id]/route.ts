import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/adminSession";

const UpdateWaitlistSchema = z.object({ contacted: z.boolean() });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = UpdateWaitlistSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const existing = await prisma.supplierWaitlistEntry.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.supplierWaitlistEntry.update({ where: { id }, data: { contacted: parsed.data.contacted } });
  return NextResponse.json({
    id: updated.id,
    name: updated.name,
    shopName: updated.shopName,
    address: updated.address,
    phone: updated.phone,
    category: updated.category,
    contacted: updated.contacted,
    createdAt: updated.createdAt,
  });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.supplierWaitlistEntry.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.supplierWaitlistEntry.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
