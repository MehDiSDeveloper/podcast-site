import "server-only";

import { siteConfig } from "@/config/site";
import { collaborationLabel, EMPTY_FIELD, inquiryFields } from "@/lib/inquiry-fields";

import { sendMail } from "./mail";
import { sendBotMessage, type InlineKeyboard } from "./messenger";

/**
 * Tells the site owner that a collaboration inquiry arrived, by email, a
 * messenger bot (Bale/Telegram) and/or webhook. Channels are independent: one
 * failing never blocks the others, and none of them can affect the stored
 * inquiry.
 */

export type InquiryNotice = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  roleTitle: string | null;
  collaborationType: string;
  teamSize: string | null;
  timeline: string | null;
  message: string;
  sourcePath: string | null;
  referrer: string | null;
  createdAt: Date;
};

export async function notifyNewInquiry(inquiry: InquiryNotice): Promise<void> {
  const channels = {
    email: sendEmail,
    messenger: sendMessengerNotice,
    webhook: postWebhook,
  };

  const results = await Promise.allSettled(Object.values(channels).map((send) => send(inquiry)));
  const names = Object.keys(channels);

  for (const [index, result] of results.entries()) {
    if (result.status === "rejected") {
      console.error(`[inquiries] ${names[index]} notification for ${inquiry.id} failed:`, result.reason);
    }
  }
}

// ------------------------------------------------------------------- email

/** INQUIRY_NOTIFY_EMAIL (comma-separated) wins; the admin's address is the fallback. */
function recipients(): string[] {
  const raw = process.env.INQUIRY_NOTIFY_EMAIL?.trim() || process.env.ADMIN_EMAIL?.trim() || "";
  return raw
    .split(",")
    .map((address) => address.trim())
    .filter(Boolean);
}

async function sendEmail(inquiry: InquiryNotice): Promise<void> {
  const to = recipients();
  if (to.length === 0) return;

  const typeLabel = collaborationLabel(inquiry.collaborationType);
  const adminUrl = `${siteConfig.url}/admin/inquiries/${inquiry.id}`;

  const filled = inquiryFields(inquiry).filter((row): row is [string, string] => Boolean(row[1]));

  const text = [
    `درخواست همکاری تازه در ${siteConfig.name}`,
    "",
    ...filled.map(([label, value]) => `${label}: ${value}`),
    "",
    "پیام:",
    inquiry.message,
    "",
    `مشاهده و پاسخ در پنل: ${adminUrl}`,
    "برای پاسخ مستقیم به فرستنده، به همین ایمیل Reply کنید.",
  ].join("\n");

  const html = `<!doctype html>
<html lang="fa" dir="rtl">
<body style="margin:0;padding:24px;background:#f6f5f2;font-family:Tahoma,Arial,sans-serif;color:#1c1b19;">
  <div dir="rtl" style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;padding:24px;text-align:right;">
    <h1 style="margin:0 0 16px;font-size:18px;">درخواست همکاری تازه: ${escapeHtml(typeLabel)}</h1>
    <table role="presentation" style="width:100%;border-collapse:collapse;font-size:14px;line-height:1.8;">
      ${filled
        .map(
          ([label, value]) =>
            `<tr><td style="padding:4px 0 4px 16px;color:#6b6760;white-space:nowrap;vertical-align:top;">${escapeHtml(label)}</td><td dir="auto" style="padding:4px 0;text-align:right;">${escapeHtml(value)}</td></tr>`,
        )
        .join("\n      ")}
    </table>
    <div dir="auto" style="text-align:right;margin:16px 0;padding:16px;background:#f6f5f2;border-radius:8px;font-size:14px;line-height:2;white-space:pre-wrap;">${escapeHtml(inquiry.message)}</div>
    <a href="${escapeHtml(adminUrl)}" style="display:inline-block;padding:10px 20px;background:#1c1b19;color:#ffffff;border-radius:8px;text-decoration:none;font-size:14px;">مشاهده در پنل مدیریت</a>
    <p style="margin:16px 0 0;font-size:12px;color:#6b6760;">برای پاسخ مستقیم به فرستنده، به همین ایمیل Reply کنید.</p>
  </div>
</body>
</html>`;

  await sendMail({
    to,
    // Replying goes straight to the person who asked.
    replyTo: inquiry.email,
    subject: `درخواست همکاری: ${typeLabel} — ${inquiry.name}${inquiry.company ? ` (${inquiry.company})` : ""}`,
    text,
    html,
  });
}

// --------------------------------------------------------------- messenger

/**
 * Buttons under a notice, drawn from the inquiry's current state so they stay
 * right however it was changed. Callback data is `inquiry:<action>:<id>`;
 * pressing an active button undoes it. See inquiry-bot.ts.
 */
export function inquiryKeyboard({ id, status, starred }: { id: string; status: string; starred: boolean }): InlineKeyboard {
  return [
    [
      starred
        ? { text: "⭐ محبوب — برداشتن", callback_data: `inquiry:unstar:${id}` }
        : { text: "☆ افزودن به محبوب‌ها", callback_data: `inquiry:star:${id}` },
      status === "NEW"
        ? { text: "👁 خوانده شد", callback_data: `inquiry:seen:${id}` }
        : { text: "✅ خوانده‌شده — برگرداندن به جدید", callback_data: `inquiry:unseen:${id}` },
    ],
    [
      status === "REJECTED"
        ? { text: "↩️ لغو رد", callback_data: `inquiry:unreject:${id}` }
        : { text: "❌ رد درخواست", callback_data: `inquiry:reject:${id}` },
      status === "ARCHIVED"
        ? { text: "↩️ خروج از بایگانی", callback_data: `inquiry:unarchive:${id}` }
        : { text: "🗄 بایگانی", callback_data: `inquiry:archive:${id}` },
    ],
  ];
}

async function sendMessengerNotice(inquiry: InquiryNotice): Promise<void> {
  await sendBotMessage(
    [
      `📩 درخواست همکاری تازه در ${siteConfig.name}`,
      "",
      // Every field, blanks included, so nothing looks lost.
      ...inquiryFields(inquiry).map(([label, value]) => `${label}: ${value || EMPTY_FIELD}`),
      "",
      "پیام:",
      inquiry.message,
      "",
      `پنل: ${siteConfig.url}/admin/inquiries/${inquiry.id}`,
    ].join("\n"),
    inquiryKeyboard({ id: inquiry.id, status: "NEW", starred: false }),
  );
}

// ----------------------------------------------------------------- webhook

/**
 * Posts a JSON summary to INQUIRY_WEBHOOK_URL when one is configured. A plain
 * webhook keeps this provider-agnostic: Slack, Discord, n8n, Zapier or a
 * custom endpoint all accept it without adding an SDK dependency.
 */
async function postWebhook(inquiry: InquiryNotice): Promise<void> {
  const url = process.env.INQUIRY_WEBHOOK_URL;
  if (!url) return;

  const summary = [
    `درخواست همکاری تازه: ${collaborationLabel(inquiry.collaborationType)}`,
    `${inquiry.name}${inquiry.company ? ` — ${inquiry.company}` : ""} <${inquiry.email}>`,
    inquiry.message.slice(0, 280),
  ].join("\n");

  // Listed explicitly so internal columns (ipHash, userAgent…) never leave the server.
  const payload = {
    id: inquiry.id,
    name: inquiry.name,
    email: inquiry.email,
    phone: inquiry.phone,
    company: inquiry.company,
    roleTitle: inquiry.roleTitle,
    collaborationType: inquiry.collaborationType,
    teamSize: inquiry.teamSize,
    timeline: inquiry.timeline,
    message: inquiry.message,
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // `text` and `content` cover Slack and Discord; `inquiry` is for custom handlers.
    body: JSON.stringify({ text: summary, content: summary, inquiry: payload }),
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) throw new Error(`webhook responded ${response.status}`);
}

// ----------------------------------------------------------------- helpers

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
