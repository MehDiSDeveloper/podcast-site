import { ArrowLeft, FileText, Headphones, Inbox, Mic, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { InquiryStatusBadge } from "@/components/admin/status-badges";
import { buttonStyles } from "@/components/ui/button";
import { COLLABORATION_TYPE_LABELS, type CollaborationType } from "@/lib/enums";
import { formatDate, toFaDigits } from "@/lib/utils";
import { requireUser } from "@/server/auth";
import { getDashboardData } from "@/server/dashboard";

export const metadata: Metadata = { title: "داشبورد" };

export default async function DashboardPage() {
  const user = await requireUser();
  const { stats, recentInquiries, topEpisodes } = await getDashboardData();

  const cards = [
    {
      label: "اپیزودهای منتشرشده",
      value: stats.published,
      hint: stats.scheduled ? `${toFaDigits(stats.scheduled)} زمان‌بندی‌شده` : undefined,
      icon: Mic,
      href: "/admin/episodes",
    },
    { label: "پیش‌نویس‌ها", value: stats.drafts, icon: FileText, href: "/admin/episodes?status=DRAFT" },
    {
      label: "درخواست‌های جدید",
      value: stats.newInquiries,
      hint: `از ${toFaDigits(stats.totalInquiries)} درخواست`,
      icon: Inbox,
      href: "/admin/inquiries",
      highlight: stats.newInquiries > 0,
    },
    { label: "مجموع پخش‌ها", value: stats.totalPlays, icon: Headphones },
  ];

  return (
    <>
      <AdminPageHeader
        title={`سلام ${user.name}`}
        description="نگاهی سریع به وضعیت سایت."
        actions={
          <Link href="/admin/episodes/new" className={buttonStyles()}>
            <Plus className="size-4" aria-hidden="true" />
            اپیزود جدید
          </Link>
        }
      />

      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          const body = (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-ink-muted">{card.label}</p>
                <span
                  className={
                    card.highlight
                      ? "grid size-9 place-items-center rounded-lg bg-accent-soft text-accent-ink"
                      : "grid size-9 place-items-center rounded-lg bg-brand-soft text-brand-strong"
                  }
                >
                  <Icon className="size-4.5" aria-hidden="true" />
                </span>
              </div>
              <p className="nums mt-3 text-3xl font-extrabold">{toFaDigits(card.value)}</p>
              {card.hint ? <p className="mt-1 text-xs text-ink-subtle">{card.hint}</p> : null}
            </>
          );

          return (
            <li key={card.label}>
              {card.href ? (
                <Link
                  href={card.href}
                  className="block h-full rounded-2xl border border-line bg-surface p-5 transition-all hover:border-line-strong hover:shadow-card"
                >
                  {body}
                </Link>
              ) : (
                <div className="h-full rounded-2xl border border-line bg-surface p-5">{body}</div>
              )}
            </li>
          );
        })}
      </ul>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <section aria-labelledby="recent-inquiries" className="rounded-2xl border border-line bg-surface">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 id="recent-inquiries" className="text-base font-bold">
              آخرین درخواست‌های همکاری
            </h2>
            <Link
              href="/admin/inquiries"
              className="inline-flex items-center gap-1 text-sm font-semibold text-brand-strong hover:text-brand"
            >
              همه
              <ArrowLeft className="size-3.5" aria-hidden="true" />
            </Link>
          </div>

          {recentInquiries.length === 0 ? (
            <p className="px-5 py-12 text-center text-sm text-ink-subtle">هنوز درخواستی ثبت نشده است.</p>
          ) : (
            <ul className="divide-y divide-line">
              {recentInquiries.map((inquiry) => (
                <li key={inquiry.id}>
                  <Link
                    href={`/admin/inquiries/${inquiry.id}`}
                    className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-surface-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">
                        {inquiry.name}
                        {inquiry.company ? <span className="font-normal text-ink-muted"> — {inquiry.company}</span> : null}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-ink-subtle">
                        {COLLABORATION_TYPE_LABELS[inquiry.collaborationType as CollaborationType] ?? inquiry.collaborationType}
                        {" · "}
                        {formatDate(inquiry.createdAt)}
                      </p>
                    </div>
                    <InquiryStatusBadge status={inquiry.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="top-episodes" className="rounded-2xl border border-line bg-surface">
          <div className="border-b border-line px-5 py-4">
            <h2 id="top-episodes" className="text-base font-bold">
              پرشنونده‌ترین اپیزودها
            </h2>
          </div>

          {topEpisodes.length === 0 ? (
            <p className="px-5 py-12 text-center text-sm text-ink-subtle">هنوز اپیزودی منتشر نشده است.</p>
          ) : (
            <ol className="divide-y divide-line">
              {topEpisodes.map((episode, index) => (
                <li key={episode.id}>
                  <Link
                    href={`/admin/episodes/${episode.id}`}
                    className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-surface-2"
                  >
                    <span className="nums grid size-6 shrink-0 place-items-center rounded-full bg-surface-2 text-xs font-bold text-ink-muted">
                      {toFaDigits(index + 1)}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{episode.title}</span>
                    <span className="nums inline-flex items-center gap-1 text-xs text-ink-subtle">
                      <Headphones className="size-3.5" aria-hidden="true" />
                      {toFaDigits(episode.playCount)}
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </>
  );
}
