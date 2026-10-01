import "server-only";

import { after } from "next/server";

import type { InquiryStatus } from "@/lib/enums";
import type { InquiryInput } from "@/lib/validation/inquiry";

import { db } from "./db";
import { notifyNewInquiry } from "./inquiry-notifications";

/**
 * Collaboration inquiries.
 *
 * Every submission is stored first and notified second, so a failing email or
 * webhook can never lose a lead — the admin panel is always the source of truth.
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

  // Runs after the response is sent: the visitor should not wait on, or fail
  // because of, a mail server or third-party webhook.
  after(() => notifyNewInquiry(inquiry));

  return inquiry;
}

// ------------------------------------------------------------- admin reads

/** Without filters: everything but the archive. Favourites include archived ones. */
export async function listInquiries({ status, starred }: { status?: InquiryStatus; starred?: boolean } = {}) {
  return db.inquiry.findMany({
    where: starred ? { starred: true } : status ? { status } : { status: { not: "ARCHIVED" } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getInquiry(id: string) {
  return db.inquiry.findUnique({ where: { id } });
}

// ----------------------------------------------------------- admin writes

/** Moves an inquiry to `status`; the first move away from NEW stamps readAt. Returns null if missing. */
export async function setInquiryStatus(id: string, status: InquiryStatus) {
  const inquiry = await getInquiry(id);
  if (!inquiry) return null;
  if (inquiry.status === status) return inquiry;

  return db.inquiry.update({
    where: { id },
    data: { status, readAt: status === "NEW" ? inquiry.readAt : (inquiry.readAt ?? new Date()) },
  });
}

/**
 * Marks an inquiry as seen (NEW → READ) or back to unseen (→ NEW).
 * Seeing an already-handled inquiry keeps its status. Returns null if missing.
 */
export async function setInquirySeen(id: string, seen: boolean) {
  const inquiry = await getInquiry(id);
  if (!inquiry) return null;

  if (seen) return inquiry.status === "NEW" ? setInquiryStatus(id, "READ") : inquiry;
  return setInquiryStatus(id, "NEW");
}

export async function setInquiryStarred(id: string, starred: boolean) {
  const { count } = await db.inquiry.updateMany({ where: { id }, data: { starred } });
  return count > 0 ? getInquiry(id) : null;
}

export async function countNewInquiries() {
  return db.inquiry.count({ where: { status: "NEW" } });
}
