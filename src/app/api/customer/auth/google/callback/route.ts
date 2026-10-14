import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CUSTOMER_SESSION_COOKIE, createCustomerSessionToken, customerSessionCookieOptions } from "@/lib/customerSession";
import { GOOGLE_STATE_COOKIE, getGoogleRedirectUri } from "@/lib/googleOAuth";
import { getPublicWebOrigin } from "@/lib/publicOrigin";

type GoogleTokenResponse = { access_token: string };
type GoogleUserInfo = { email?: string; name?: string; email_verified?: boolean };

function failureRedirect(reason: string) {
  const url = new URL("/login", getPublicWebOrigin());
  url.searchParams.set("error", reason);
  const response = NextResponse.redirect(url.toString());
  response.cookies.delete(GOOGLE_STATE_COOKIE);
  return response;
}

export async function GET(request: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: "Google sign-in isn't configured." }, { status: 500 });
  }

  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state");

  if (requestUrl.searchParams.get("error")) {
    return failureRedirect("google_denied");
  }
  if (!code || !state) {
    return failureRedirect("google_failed");
  }

  const cookieStore = request.headers.get("cookie") ?? "";
  const expectedState = cookieStore
    .split(";")
    .map((pair) => pair.trim())
    .find((pair) => pair.startsWith(`${GOOGLE_STATE_COOKIE}=`))
    ?.split("=")[1];

  if (!expectedState || expectedState !== state) {
    return failureRedirect("google_state_mismatch");
  }

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: getGoogleRedirectUri(),
    }),
  });
  if (!tokenRes.ok) {
    return failureRedirect("google_token_exchange_failed");
  }
  const tokens: GoogleTokenResponse = await tokenRes.json();

  const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  if (!userRes.ok) {
    return failureRedirect("google_profile_fetch_failed");
  }
  const profile: GoogleUserInfo = await userRes.json();
  if (!profile.email || profile.email_verified === false) {
    return failureRedirect("google_no_email");
  }

  // Phone sign-up lets anyone type in ANY email, completely unverified —
  // so before letting this real, Google-verified address claim a row,
  // reclaim it from whoever merely self-reported it. Otherwise someone
  // could type in a stranger's email during phone sign-up, and when that
  // stranger later signs in with Google for real, they'd be merged into
  // an account the first person already controls.
  const unverifiedClaim = await prisma.customer.findFirst({
    where: { email: profile.email, emailVerifiedAt: null },
  });
  if (unverifiedClaim) {
    await prisma.customer.update({ where: { id: unverifiedClaim.id }, data: { email: null } });
  }

  // Upserting by email links this Google sign-in to an existing account if
  // one already exists with that address (e.g. a genuine past Google
  // sign-in, or a phone-signup where this exact email was just reclaimed
  // above) — same identity, one row.
  const customer = await prisma.customer.upsert({
    where: { email: profile.email },
    update: { name: profile.name ?? undefined, emailVerifiedAt: new Date() },
    create: { name: profile.name ?? profile.email, email: profile.email, emailVerifiedAt: new Date() },
  });

  const token = await createCustomerSessionToken({ customerId: customer.id, phone: customer.phone ?? "" });

  const response = NextResponse.redirect(new URL("/shop", getPublicWebOrigin()).toString());
  response.cookies.set(CUSTOMER_SESSION_COOKIE, token, customerSessionCookieOptions);
  response.cookies.delete(GOOGLE_STATE_COOKIE);
  return response;
}
