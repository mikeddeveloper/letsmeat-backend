import "server-only";
import { sendMail } from "@/lib/mail";

export async function sendAdminInviteEmail({ to, name, role, inviteUrl }: { to: string; name: string; role: string; inviteUrl: string }) {
  const firstName = name.trim().split(/\s+/)[0] || "there";

  await sendMail({
    to,
    subject: "You've been invited to the LetsMeat admin console",
    text: `Hey ${firstName}, you've been added as ${role} on the LetsMeat admin console. Set your password to get started: ${inviteUrl} (this link expires in 48 hours)`,
    html: `
      <div style="font-family: -apple-system, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; color: #1a1611;">
        <h1 style="font-size: 22px; margin-bottom: 4px;">Hey ${firstName}, you're invited. 🥩</h1>
        <p style="font-size: 15px; line-height: 1.6; color: #5b5346;">
          You've been added as <strong>${role}</strong> on the LetsMeat admin console. Set your password to get started.
        </p>
        <p style="margin-top: 24px;">
          <a href="${inviteUrl}" style="background:#f2a33d; color:#1a1205; font-weight:700; padding:12px 24px; border-radius:10px; text-decoration:none; display:inline-block;">
            Set your password
          </a>
        </p>
        <p style="margin-top: 24px; font-size: 13px; color: #8a8375;">This link expires in 48 hours. If you weren't expecting this, you can ignore this email.</p>
      </div>
    `,
  });
}
