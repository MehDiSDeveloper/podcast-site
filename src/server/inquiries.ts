import "server-only";

import { COLLABORATION_TYPE_LABELS, type InquiryStatus } from "@/lib/enums";
import type { InquiryInput } from "@/lib/validation/inquiry";

import { db } from "./db";

/**
 * Collaboration inquiries.
 *
 * Every submission is stored first and notified second, so a failing webhook
 * can never lose a lead — the admin panel is always the source of truth.
 */

/** A real person rarely sends more than a couple of requests an hour. */
const RATE_LIMIT = { max: 3, windowMs: 60 * 60 * 1000 };

export class RateLimitError extends Error {
  constructor() {
    super("Too many inquiries from this client.");
    this.name = "RateLimitError";
  }
}

export async function isRateLimited(ipHash: string): Promise<boolean> {
  const since = new Date(Date.now() - RATE_LIMIT.windowMs);
  const recent = await db.inquiry.count({ where: { ipHash, createdAt: { gte: since } } });
  return recent >= RATE_LIMIT.max;
}

export async function createInquiry(
  input: InquiryInput,
  context: { ipHash: string; userAgent: string | null; sourcePath?: string; referrer?: string },
) {
  if (await isRateLimited(context.ipHash)) throw new RateLimitError();

  const inquiry = await db.inquiry.create({
    data: {
      name: input.name,
      email: input.email,
      phone: input.phone,
      company: input.company,
      roleTitle: input.roleTitle,
      collaborationType: input.collaborationType,
      teamSize: input.teamSize,
      timeline: input.timeline,
      message: input.message,
      ipHash: context.ipHash,
      userAgent: context.userAgent,
      sourcePath: context.sourcePath?.slice(0, 300),
      referrer: context.referrer?.slice(0, 500),
    },
  });

  // Fire-and-forget: the visitor should not wait on, or fail because of, a
  // third-party notification service.
  void notifyNewInquiry(inquiry).catch((error) =>
    console.error("[inquiries] notification failed:", error),
  );

  return inquiry;
}

/**
 * Posts a JSON summary to INQUIRY_WEBHOOK_URL when one is configured. A plain
 * webhook keeps this provider-agnostic: Slack, Discord, n8n, Zapier or a
 * custom endpoint all accept it without adding an SDK dependency.
 */
async function notifyNewInquiry(inquiry: {
  id: string;
  name: string;
  email: string;
  company: string | null;
  collaborationType: string;
  message: string;
}) {
  const url = process.env.INQUIRY_WEBHOOK_URL;
  if (!url) return;

  const typeLabel =
    COLLABORATION_TYPE_LABELS[inquiry.collaborationType as keyof typeof COLLABORATION_TYPE_LABELS] ??
    inquiry.collaborationType;

  const summary = [
    `درخواست همکاری تازه: ${typeLabel}`,
    `${inquiry.name}${inquiry.company ? ` — ${inquiry.company}` : ""} <${inquiry.email}>`,
    inquiry.message.slice(0, 280),
  ].join("\n");

  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // `text` and `content` cover Slack and Discord; `inquiry` is for custom handlers.
    body: JSON.stringify({ text: summary, content: summary, inquiry }),
    signal: AbortSignal.timeout(5000),
  });
}

// ------------------------------------------------------------- admin reads

export async function listInquiries({ status }: { status?: InquiryStatus } = {}) {
  return db.inquiry.findMany({
    where: status ? { status } : { status: { not: "ARCHIVED" } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getInquiry(id: string) {
  return db.inquiry.findUnique({ where: { id } });
}

export async function countNewInquiries() {
  return db.inquiry.count({ where: { status: "NEW" } });
}
