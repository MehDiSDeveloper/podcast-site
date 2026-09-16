import type { Metadata } from "next";
import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { InquiryStatusBadge } from "@/components/admin/status-badges";
import {
  COLLABORATION_TYPE_LABELS,
  INQUIRY_STATUS_LABELS,
  INQUIRY_STATUSES,
  type CollaborationType,
  type InquiryStatus,
} from "@/lib/enums";
import { cn, formatDate, toFaDigits } from "@/lib/utils";
import { listInquiries } from "@/server/inquiries";

export const metadata: Metadata = { title: "درخواست‌های همکاری" };

export default async function AdminInquiriesPage({ searchParams }: PageProps<"/admin/inquiries">) {
  const params = await searchParams;
  const status = INQUIRY_STATUSES.includes(params.status as InquiryStatus) ? (params.status as InquiryStatus) : undefined;
  const inquiries = await listInquiries({ status });

  return (
    <>
      <AdminPageHeader
        title="درخواست‌های همکاری"
        description="پیام‌هایی که از فرم تماس سایت رسیده‌اند. بایگانی‌شده‌ها فقط در فیلتر خودشان دیده می‌شوند."
      />

      <nav aria-label="فیلتر وضعیت" className="mb-5 flex flex-wrap gap-2">
        {[undefined, ...INQUIRY_STATUSES].map((value) => (
          <Link
            key={value ?? "active"}
            href={value ? `/admin/inquiries?status=${value}` : "/admin/inquiries"}
            aria-current={status === value ? "page" : undefined}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
              status === value ? "border-brand bg-brand-soft text-brand-strong" : "border-line bg-surface text-ink-muted hover:text-ink",
            )}
          >
            {value ? INQUIRY_STATUS_LABELS[value] : "فعال"}
          </Link>
        ))}
      </nav>

      {inquiries.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line-strong bg-surface px-6 py-16 text-center text-ink-muted">
          درخواستی در این فهرست نیست.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {inquiries.map((inquiry) => (
            <li key={inquiry.id}>
              <Link
                href={`/admin/inquiries/${inquiry.id}`}
                className={cn(
                  "flex flex-col gap-3 rounded-2xl border bg-surface p-5 transition-all hover:shadow-card sm:flex-row sm:items-center",
                  inquiry.status === "NEW" ? "border-accent/50" : "border-line",
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className="font-bold">
                    {inquiry.name}
                    {inquiry.company ? <span className="font-normal text-ink-muted"> — {inquiry.company}</span> : null}
                  </p>
                  <p className="mt-1 text-xs text-ink-subtle">
                    {COLLABORATION_TYPE_LABELS[inquiry.collaborationType as CollaborationType] ?? inquiry.collaborationType}
                    {inquiry.teamSize ? ` · تیم ${inquiry.teamSize}` : ""}
                    {" · "}
                    {formatDate(inquiry.createdAt)}
                  </p>
                  <p className="mt-2 line-clamp-2 text-sm leading-loose text-ink-muted">{inquiry.message}</p>
                </div>
                <InquiryStatusBadge status={inquiry.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-6 text-xs text-ink-subtle">{toFaDigits(inquiries.length)} مورد</p>
    </>
  );
}
