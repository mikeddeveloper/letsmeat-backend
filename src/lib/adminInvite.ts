import "server-only";
import { SignJWT, jwtVerify } from "jose";
import crypto from "node:crypto";
import { hashPassword } from "@/lib/password";

const INVITE_DURATION_SECONDS = 60 * 60 * 48; // 48 hours

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("Missing required env var: SESSION_SECRET");
  return new TextEncoder().encode(secret);
}

export function getPublicAdminOrigin() {
  const origin = process.env.PUBLIC_ADMIN_ORIGIN;
  if (!origin) throw new Error("Missing required env var: PUBLIC_ADMIN_ORIGIN");
  return origin;
}

export type AdminInvitePayload = {
  purpose: "admin_invite";
  adminId: string;
  email: string;
};

export async function createAdminInviteToken(payload: Omit<AdminInvitePayload, "purpose">) {
  return new SignJWT({ ...payload, purpose: "admin_invite" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${INVITE_DURATION_SECONDS}s`)
    .sign(getSecret());
}

export async function verifyAdminInviteToken(token: string): Promise<AdminInvitePayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (payload.purpose !== "admin_invite" || typeof payload.adminId !== "string" || typeof payload.email !== "string") {
      return null;
    }
    return { purpose: "admin_invite", adminId: payload.adminId, email: payload.email };
  } catch {
    return null;
  }
}

/** A password hash nobody can ever know the plaintext of — the account
 *  exists (so it shows up in the team list right away) but genuinely can't
 *  be logged into until the invite is accepted and a real password is set. */
export function unusablePasswordHash() {
  return hashPassword(crypto.randomUUID() + crypto.randomUUID());
}
