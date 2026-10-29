import "server-only";
import { Resend } from "resend";

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

let client: Resend | null = null;

function getClient() {
  if (client) return client;
  client = new Resend(requireEnv("RESEND_API_KEY"));
  return client;
}

export async function sendMail({
  to,
  subject,
  html,
  text,
}: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}) {
  // onboarding@resend.dev works out of the box with no domain setup —
  // once a real domain is verified in Resend, swap MAIL_FROM_ADDRESS to an
  // address on that domain and nothing else here needs to change.
  const fromAddress = process.env.MAIL_FROM_ADDRESS || "onboarding@resend.dev";
  const fromName = process.env.MAIL_FROM_NAME ?? "LetsMeat";

  const { error } = await getClient().emails.send({
    from: `${fromName} <${fromAddress}>`,
    to,
    subject,
    html,
    text,
  });

  if (error) throw new Error(`Resend failed to send mail: ${error.message}`);
}
