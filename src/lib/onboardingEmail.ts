import "server-only";
import { sendMail } from "@/lib/mail";
import { getPublicWebOrigin } from "@/lib/publicOrigin";

export async function sendOnboardingEmail({ to, name }: { to: string; name: string }) {
  const firstName = name.trim().split(/\s+/)[0] || "there";
  const shopUrl = `${getPublicWebOrigin()}/shop`;

  await sendMail({
    to,
    subject: "Welcome to LetsMeat 🥩",
    text: `Hey ${firstName}, welcome to LetsMeat — point at the animal, pick your cut, and we price it live and deliver the same day. Jump in at ${shopUrl}`,
    html: `
      <div style="font-family: -apple-system, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; color: #1a1611;">
        <h1 style="font-size: 22px; margin-bottom: 4px;">Hey ${firstName}, you're in. 🥩</h1>
        <p style="font-size: 15px; line-height: 1.6; color: #5b5346;">
          Welcome to LetsMeat — point at the animal, pick the exact cut you want, choose fresh or frozen,
          and we price it live and track it from supplier to your door.
        </p>
        <p style="margin-top: 24px;">
          <a href="${shopUrl}" style="background:#f2a33d; color:#1a1205; font-weight:700; padding:12px 24px; border-radius:10px; text-decoration:none; display:inline-block;">
            Start shopping
          </a>
        </p>
      </div>
    `,
  });
}
