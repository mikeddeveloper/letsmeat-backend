import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { ADMIN_SESSION_COOKIE, adminSessionCookieOptions, createAdminSessionToken } from "@/lib/adminSession";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : null;
  const password = typeof body?.password === "string" ? body.password : null;

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const admin = await prisma.adminUser.findUnique({ where: { email } });
  const passwordMatches = admin ? await verifyPassword(password, admin.passwordHash) : false;

  if (!admin || !passwordMatches) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  await prisma.adminUser.update({ where: { id: admin.id }, data: { lastActiveAt: new Date() } });

  const token = await createAdminSessionToken({ adminId: admin.id, email: admin.email, role: admin.role });

  const response = NextResponse.json({
    admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role },
  });
  response.cookies.set(ADMIN_SESSION_COOKIE, token, adminSessionCookieOptions);
  return response;
}
