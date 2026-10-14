import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { GOOGLE_STATE_COOKIE, getGoogleRedirectUri } from "@/lib/googleOAuth";

// Kicks off the standard OAuth 2.0 authorization-code flow: send the user
// to Google's consent screen, with a random `state` value stashed in a
// short-lived cookie so the callback can confirm the redirect actually
// came from a flow we started (basic CSRF protection).
export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "Google sign-in isn't configured." }, { status: 500 });
  }

  const state = randomBytes(16).toString("hex");

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", getGoogleRedirectUri());
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "openid email profile");
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("prompt", "select_account");

  const response = NextResponse.redirect(authUrl.toString());
  response.cookies.set(GOOGLE_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  return response;
}
