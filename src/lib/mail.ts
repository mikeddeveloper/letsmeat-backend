import "server-only";
import nodemailer from "nodemailer";

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: requireEnv("MAIL_HOST"),
    port: Number(process.env.MAIL_PORT ?? 587),
    secure: process.env.MAIL_ENCRYPTION === "ssl",
    auth: {
      user: requireEnv("MAIL_USERNAME"),
      pass: requireEnv("MAIL_PASSWORD"),
    },
  });
  return transporter;
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
  const fromAddress = requireEnv("MAIL_FROM_ADDRESS");
  const fromName = process.env.MAIL_FROM_NAME ?? "LetsMeat";

  return getTransporter().sendMail({
    from: `"${fromName}" <${fromAddress}>`,
    to,
    subject,
    html,
    text,
  });
}
