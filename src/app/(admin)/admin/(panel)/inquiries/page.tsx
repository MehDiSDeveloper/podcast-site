import type { Metadata } from "next";
import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { InquiryStarButton } from "@/components/admin/inquiry-star-button";
import { InquiryStatusBadge } from "@/components/admin/status-badges";
import {
  COLLABORATION_TYPE_LABELS,
  INQUIRY_STATUS_LABELS,
  INQUIRY_STATUSES,
  type CollaborationType,
  type InquiryStatus,
} from "@/lib/enums";
import { cn, formatDateTime, toFaDigits } from "@/lib/utils";
import { listInquiries } from "@/server/inquiries";

export const metadata: Metadata = { title: "درخواست‌های همکاری" };

export default async function AdminInquiriesPage({ searchParams }: PageProps<"/admin/inquiries">) {
  const params = await searchParams;
  const starred = params.starred === "1";
  const status =
    !starred && INQUIRY_STATUSES.includes(params.status as InquiryStatus) ? (params.status as InquiryStatus) : undefined;
  const inquiries = await listInquiries({ status, starred });

  const filters = [
    { key: "active", href: "/admin/inquiries", label: "فعال", current: !starred && !status },
    { key: "starred", href: "/admin/inquiries?starred=1", label: "محبوب‌ها", current: starred },
    ...INQUIRY_STATUSES.map((value) => ({
      key: value,
      href: `/admin/inquiries?status=${value}`,
      label: INQUIRY_STATUS_LABELS[value],
      current: status === value,
    })),
  ];

  return (
    <>
      <AdminPageHeader
        title="درخواست‌های همکاری"
        description="پیام‌هایی که از فرم تماس سایت رسیده‌اند. بایگانی‌شده‌ها فقط در فیلتر خودشان و محبوب‌ها دیده می‌شوند."
      />

      <nav aria-label="فیلتر وضعیت" className="mb-5 flex flex-wrap gap-2">
        {filters.map((filter) => (
          <Link
            key={filter.key}
            href={filter.href}
            aria-current={filter.current ? "page" : undefined}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
              filter.current ? "border-brand bg-brand-soft text-brand-strong" : "border-line bg-surface text-ink-muted hover:text-ink",
            )}
          >
            {filter.label}
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
            <li key={inquiry.id} className="relative">
              <Link
                href={`/admin/inquiries/${inquiry.id}`}
                className={cn(
                  "flex flex-col gap-3 rounded-2xl border bg-surface p-5 pe-16 transition-all hover:shadow-card sm:flex-row sm:items-center",
                  inquiry.status === "NEW" ? "border-accent/50" : "border-line",
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className="font-bold">
                    {inquiry.name}
                    {inquiry.company ? <span className="font-normal text-ink-muted"> — {inquiry.company}</span> : null}
                    {inquiry.roleTitle ? <span className="font-normal text-ink-muted"> · {inquiry.roleTitle}</span> : null}
                  </p>
                  <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted">
                    <span dir="ltr">{inquiry.email}</span>
                    {inquiry.phone ? <span dir="ltr">{inquiry.phone}</span> : null}
                  </p>
                  <p className="mt-1 text-xs text-ink-subtle">
                    {COLLABORATION_TYPE_LABELS[inquiry.collaborationType as CollaborationType] ?? inquiry.collaborationType}
                    {inquiry.teamSize ? ` · تیم ${inquiry.teamSize}` : ""}
                    {inquiry.timeline ? ` · ${inquiry.timeline}` : ""}
                    {" · "}
                    {formatDateTime(inquiry.createdAt)}
                  </p>
                  <p className="mt-2 line-clamp-2 text-sm leading-loose text-ink-muted">{inquiry.message}</p>
                </div>
                <InquiryStatusBadge status={inquiry.status} />
              </Link>
              {/* Outside the link: a button can't be nested in an anchor. */}
              <InquiryStarButton id={inquiry.id} starred={inquiry.starred} className="absolute end-4 top-4" />
            </li>
          ))}
        </ul>
      )}

      <p className="mt-6 text-xs text-ink-subtle">{toFaDigits(inquiries.length)} مورد</p>
    </>
  );
}
