import "server-only";

import nodemailer, { type Transporter } from "nodemailer";

/**
 * Outgoing email over plain SMTP.
 *
 * SMTP rather than a provider SDK keeps the site portable: Gmail (with an app
 * password), a host's mailbox, Mailgun, Brevo, SES and Resend all speak it.
 * Mail is optional — without SMTP_HOST every send is a logged no-op.
 */

type MailConfig = {
  host: string;
  port: number;
  secure: boolean;
  user?: string;
  password?: string;
  from: string;
};

function readConfig(): MailConfig | null {
  const host = process.env.SMTP_HOST?.trim();
  if (!host) return null;

  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER?.trim() || undefined;
  const from = process.env.MAIL_FROM?.trim() || user;

  if (user && !process.env.SMTP_PASSWORD) {
    console.warn("[mail] SMTP_USER is set but SMTP_PASSWORD is empty — mail is disabled.");
    return null;
  }

  if (!from) {
    console.warn("[mail] SMTP_HOST is set but neither MAIL_FROM nor SMTP_USER is — mail is disabled.");
    return null;
  }

  return {
    host,
    port,
    // 465 is implicit TLS; 587 and 25 upgrade with STARTTLS.
    secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : port === 465,
    user,
    password: process.env.SMTP_PASSWORD || undefined,
    from,
  };
}

let cached: { config: MailConfig; transporter: Transporter } | null | undefined;

function getMailer() {
  if (cached !== undefined) return cached;

  const config = readConfig();
  cached = config
    ? {
        config,
        transporter: nodemailer.createTransport({
          host: config.host,
          port: config.port,
          secure: config.secure,
          auth: config.user ? { user: config.user, pass: config.password } : undefined,
          // Fail fast instead of holding a connection open for minutes.
          connectionTimeout: 10_000,
          greetingTimeout: 10_000,
          socketTimeout: 20_000,
        }),
      }
    : null;

  return cached;
}

export function isMailConfigured(): boolean {
  return getMailer() !== null;
}

export type MailMessage = {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
};

/** Sends a message. Throws on SMTP errors; returns false when mail is not configured. */
export async function sendMail(message: MailMessage): Promise<boolean> {
  const mailer = getMailer();
  if (!mailer) return false;

  await mailer.transporter.sendMail({ from: mailer.config.from, ...message });
  return true;
}

/**
 * Logs whether SMTP accepts our credentials, so a typo in .env shows up in the
 * startup logs rather than as a silently missed lead weeks later.
 */
export async function checkMailSetup(): Promise<void> {
  const mailer = getMailer();
  if (!mailer) return;

  try {
    await mailer.transporter.verify();
    console.info(`[mail] SMTP ready at ${mailer.config.host}:${mailer.config.port}.`);
  } catch (error) {
    console.error("[mail] SMTP check failed — notification emails will not be delivered:", error);
  }
}
