import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/adminSession";
import { createAdminInviteToken, getPublicAdminOrigin, unusablePasswordHash } from "@/lib/adminInvite";
import { sendAdminInviteEmail } from "@/lib/adminInviteEmail";

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

const InviteSchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.string().trim().email().toLowerCase(),
  role: z.enum(["Super Admin", "Catalog Manager", "Support Lead", "Finance Admin"]),
});

// Only a Super Admin can grant someone else access to this console — every
// other role is read/write-scoped to its own area, not to who else gets in.
export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "Super Admin") {
    return NextResponse.json({ error: "Only a Super Admin can invite new team members." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = InviteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid invite payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.adminUser.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    return NextResponse.json({ error: "Someone with that email already has access." }, { status: 409 });
  }

  const admin = await prisma.adminUser.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      role: parsed.data.role,
      // Nobody — including whoever ran this request — ever knows this value.
      // The account exists but can't be signed into until accept-invite sets
      // a real password.
      passwordHash: await unusablePasswordHash(),
    },
  });

  const token = await createAdminInviteToken({ adminId: admin.id, email: admin.email });
  const inviteUrl = `${getPublicAdminOrigin()}/accept-invite?token=${token}`;

  try {
    await sendAdminInviteEmail({ to: admin.email, name: admin.name, role: admin.role, inviteUrl });
  } catch (err) {
    // The account is still created — an admin can resend by deleting and
    // re-inviting, or the mail issue gets fixed and this logs clearly either way.
    console.error("Failed to send admin invite email:", err);
  }

  return NextResponse.json(
    { id: admin.id, name: admin.name, email: admin.email, role: admin.role, lastActiveAt: admin.lastActiveAt },
    { status: 201 },
  );
}
