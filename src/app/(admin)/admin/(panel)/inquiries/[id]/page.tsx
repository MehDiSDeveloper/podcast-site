import { ArrowRight, Mail, Phone } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { InquiryForm } from "@/components/admin/inquiry-form";
import { InquiryStatusBadge } from "@/components/admin/status-badges";
import { buttonStyles } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { COLLABORATION_TYPE_LABELS, type CollaborationType } from "@/lib/enums";
import { formatDate } from "@/lib/utils";
import { db } from "@/server/db";
import { getInquiry } from "@/server/inquiries";

export const metadata: Metadata = { title: "جزئیات درخواست" };

export default async function InquiryDetailPage({ params }: PageProps<"/admin/inquiries/[id]">) {
  const { id } = await params;
  let inquiry = await getInquiry(id);
  if (!inquiry) notFound();

  // Opening a new inquiry marks it as read.
  if (inquiry.status === "NEW") {
    inquiry = await db.inquiry.update({ where: { id }, data: { status: "READ", readAt: new Date() } });
  }

  const typeLabel = COLLABORATION_TYPE_LABELS[inquiry.collaborationType as CollaborationType] ?? inquiry.collaborationType;
  const replySubject = encodeURIComponent(`درخواست ${typeLabel} — ${siteConfig.name}`);

  const details: [string, string | null][] = [
    ["نوع همکاری", typeLabel],
    ["سازمان", inquiry.company],
    ["سمت", inquiry.roleTitle],
    ["اندازه‌ی تیم", inquiry.teamSize],
    ["زمان‌بندی", inquiry.timeline],
    ["تاریخ ارسال", formatDate(inquiry.createdAt)],
    ["صفحه‌ی مبدأ", inquiry.sourcePath],
    ["ورود از", inquiry.referrer],
  ];

  return (
    <>
      <Link href="/admin/inquiries" className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink">
        <ArrowRight className="size-4" aria-hidden="true" />
        همه‌ی درخواست‌ها
      </Link>

      <AdminPageHeader
        title={inquiry.name}
        description={inquiry.company ?? undefined}
        actions={
          <>
            <InquiryStatusBadge status={inquiry.status} />
            <a href={`mailto:${inquiry.email}?subject=${replySubject}`} className={buttonStyles({ size: "sm" })}>
              <Mail className="size-4" aria-hidden="true" />
              پاسخ با ایمیل
            </a>
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <section className="rounded-2xl border border-line bg-surface p-6">
            <h2 className="text-base font-bold">پیام</h2>
            <p className="mt-4 whitespace-pre-line leading-loose text-ink-muted">{inquiry.message}</p>
          </section>

          <section className="rounded-2xl border border-line bg-surface p-6">
            <h2 className="text-base font-bold">وضعیت و یادداشت داخلی</h2>
            <div className="mt-5">
              <InquiryForm id={inquiry.id} status={inquiry.status} adminNotes={inquiry.adminNotes ?? ""} />
            </div>
          </section>
        </div>

        <aside className="flex flex-col gap-6 xl:sticky xl:top-22 xl:self-start">
          <section className="rounded-2xl border border-line bg-surface p-6">
            <h2 className="text-base font-bold">ارتباط</h2>
            <ul className="mt-4 flex flex-col gap-3 text-sm">
              <li className="flex items-center gap-2.5">
                <Mail className="size-4 text-ink-subtle" aria-hidden="true" />
                <a href={`mailto:${inquiry.email}`} dir="ltr" className="font-medium hover:text-brand-strong">
                  {inquiry.email}
                </a>
              </li>
              {inquiry.phone ? (
                <li className="flex items-center gap-2.5">
                  <Phone className="size-4 text-ink-subtle" aria-hidden="true" />
                  <a href={`tel:${inquiry.phone}`} dir="ltr" className="font-medium hover:text-brand-strong">
                    {inquiry.phone}
                  </a>
                </li>
              ) : null}
            </ul>
          </section>

          <section className="rounded-2xl border border-line bg-surface p-6">
            <h2 className="text-base font-bold">جزئیات</h2>
            <dl className="mt-4 flex flex-col gap-3 text-sm">
              {details
                .filter(([, value]) => value)
                .map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-xs text-ink-subtle">{label}</dt>
                    <dd className="mt-0.5 break-words font-medium">{value}</dd>
                  </div>
                ))}
            </dl>
          </section>
        </aside>
      </div>
    </>
  );
}
