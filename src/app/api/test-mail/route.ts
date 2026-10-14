import { NextResponse } from "next/server";
import { sendOnboardingEmail } from "@/lib/onboardingEmail";

export async function POST(request: Request) {
  const { to } = await request.json().catch(() => ({ to: undefined }));
  if (!to || typeof to !== "string") {
    return NextResponse.json({ error: "Provide { to: \"you@example.com\" }" }, { status: 400 });
  }
  try {
    await sendOnboardingEmail({ to, name: "Michael" });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
