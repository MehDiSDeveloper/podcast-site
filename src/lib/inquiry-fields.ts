import { COLLABORATION_TYPE_LABELS, type CollaborationType } from "@/lib/enums";
import { formatDateTime } from "@/lib/utils";

/**
 * Everything the visitor submitted, in form order, as label/value pairs.
 * Shared by the admin panel and every notification channel so none of them
 * can silently drop a field. Empty values are kept (as null) on purpose: the
 * reader should see that a field was left blank, not wonder if it was lost.
 */

type InquiryLike = {
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  roleTitle: string | null;
  collaborationType: string;
  teamSize: string | null;
  timeline: string | null;
  sourcePath: string | null;
  referrer: string | null;
  createdAt: Date;
};

export function collaborationLabel(type: string): string {
  return COLLABORATION_TYPE_LABELS[type as CollaborationType] ?? type;
}

export function inquiryFields(inquiry: InquiryLike): [label: string, value: string | null][] {
  return [
    ["نوع همکاری", collaborationLabel(inquiry.collaborationType)],
    ["نام", inquiry.name],
    ["ایمیل", inquiry.email],
    ["شماره‌ی تماس", inquiry.phone],
    ["سازمان", inquiry.company],
    ["سمت", inquiry.roleTitle],
    ["اندازه‌ی تیم", inquiry.teamSize],
    ["زمان‌بندی", inquiry.timeline],
    ["تاریخ ارسال", formatDateTime(inquiry.createdAt)],
    ["صفحه‌ی مبدأ", inquiry.sourcePath],
    ["ورود از", inquiry.referrer],
  ];
}

/** Shown in place of a field the visitor left blank. */
export const EMPTY_FIELD = "—";
