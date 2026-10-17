import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { verifyAdminInviteToken } from "@/lib/adminInvite";
import { ADMIN_SESSION_COOKIE, adminSessionCookieOptions, createAdminSessionToken } from "@/lib/adminSession";

// Public — the invited person has no session yet. The token itself (signed,
// short-lived, bound to one adminId+email) is the only credential needed to
// reach this far; setting the password is what actually activates the account.
const AcceptInviteSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(200),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = AcceptInviteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const payload = await verifyAdminInviteToken(parsed.data.token);
  if (!payload) {
    return NextResponse.json({ error: "This invite link is invalid or has expired." }, { status: 400 });
  }

  const admin = await prisma.adminUser.findUnique({ where: { id: payload.adminId } });
  if (!admin || admin.email !== payload.email) {
    return NextResponse.json({ error: "This invite is no longer valid." }, { status: 400 });
  }

  const passwordHash = await hashPassword(parsed.data.password);
  await prisma.adminUser.update({ where: { id: admin.id }, data: { passwordHash, lastActiveAt: new Date() } });

  const token = await createAdminSessionToken({ adminId: admin.id, email: admin.email, role: admin.role });
  const response = NextResponse.json({ admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role } });
  response.cookies.set(ADMIN_SESSION_COOKIE, token, adminSessionCookieOptions);
  return response;
}
