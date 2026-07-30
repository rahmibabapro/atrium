/**
 * Email delivery abstraction, first configured provider wins:
 *   1. RESEND_API_KEY          — Resend HTTP API (no SDK needed)
 *   2. ATRIUM_SMTP_URL         — any SMTP relay via nodemailer
 *   3. neither                 — logs to stdout (dev), reports not-configured
 * Sender address comes from ATRIUM_EMAIL_FROM.
 */

export type EmailMessage = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export type EmailResult = { sent: boolean; provider: "resend" | "smtp" | "none" };

function fromAddress(): string {
  return process.env.ATRIUM_EMAIL_FROM || "Atrium <no-reply@localhost>";
}

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY || process.env.ATRIUM_SMTP_URL);
}

async function sendViaResend(msg: EmailMessage): Promise<EmailResult> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromAddress(),
      to: [msg.to],
      subject: msg.subject,
      text: msg.text,
      html: msg.html,
    }),
  });
  if (!res.ok) {
    throw new Error(`Resend failed: ${res.status} ${await res.text()}`);
  }
  return { sent: true, provider: "resend" };
}

async function sendViaSmtp(msg: EmailMessage): Promise<EmailResult> {
  const { createTransport } = await import("nodemailer");
  const transport = createTransport(process.env.ATRIUM_SMTP_URL);
  await transport.sendMail({
    from: fromAddress(),
    to: msg.to,
    subject: msg.subject,
    text: msg.text,
    html: msg.html,
  });
  return { sent: true, provider: "smtp" };
}

export async function sendEmail(msg: EmailMessage): Promise<EmailResult> {
  if (process.env.RESEND_API_KEY) return sendViaResend(msg);
  if (process.env.ATRIUM_SMTP_URL) return sendViaSmtp(msg);
  console.log(
    `[email:not-configured] to=${msg.to} subject="${msg.subject}"\n${msg.text}`,
  );
  return { sent: false, provider: "none" };
}
