import { ExternalLink, Headphones, Plus, Star } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { EpisodeStatusBadge } from "@/components/admin/status-badges";
import { buttonStyles } from "@/components/ui/button";
import { EPISODE_STATUS_LABELS, EPISODE_STATUSES, type EpisodeStatus } from "@/lib/enums";
import { cn, formatDate, formatDurationLabel, toFaDigits } from "@/lib/utils";
import { listAdminEpisodes } from "@/server/admin/episodes";

export const metadata: Metadata = { title: "اپیزودها" };

export default async function AdminEpisodesPage({ searchParams }: PageProps<"/admin/episodes">) {
  const params = await searchParams;
  const status = EPISODE_STATUSES.includes(params.status as EpisodeStatus) ? (params.status as EpisodeStatus) : undefined;
  const episodes = await listAdminEpisodes({ status });

  return (
    <>
      <AdminPageHeader
        title="اپیزودها"
        description="ایجاد، ویرایش و انتشار اپیزودهای پادکست."
        actions={
          <Link href="/admin/episodes/new" className={buttonStyles()}>
            <Plus className="size-4" aria-hidden="true" />
            اپیزود جدید
          </Link>
        }
      />

      {params.deleted ? (
        <p role="status" className="mb-5 rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink-muted">
          اپیزود حذف شد.
        </p>
      ) : null}

      <nav aria-label="فیلتر وضعیت" className="mb-5 flex flex-wrap gap-2">
        {[undefined, ...EPISODE_STATUSES].map((value) => (
          <Link
            key={value ?? "all"}
            href={value ? `/admin/episodes?status=${value}` : "/admin/episodes"}
            aria-current={status === value ? "page" : undefined}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
              status === value
                ? "border-brand bg-brand-soft text-brand-strong"
                : "border-line bg-surface text-ink-muted hover:text-ink",
            )}
          >
            {value ? EPISODE_STATUS_LABELS[value] : "همه"}
          </Link>
        ))}
      </nav>

      {episodes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line-strong bg-surface px-6 py-16 text-center">
          <p className="font-bold">اپیزودی پیدا نشد</p>
          <Link href="/admin/episodes/new" className={buttonStyles({ variant: "outline", className: "mt-5" })}>
            ساختن اولین اپیزود
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-surface">
          <table className="w-full text-sm">
            <thead className="border-b border-line bg-surface-2/60 text-xs text-ink-subtle">
              <tr>
                <th scope="col" className="px-5 py-3 text-right font-semibold">
                  عنوان
                </th>
                <th scope="col" className="hidden px-3 py-3 text-right font-semibold md:table-cell">
                  وضعیت
                </th>
                <th scope="col" className="hidden px-3 py-3 text-right font-semibold lg:table-cell">
                  انتشار
                </th>
                <th scope="col" className="hidden px-3 py-3 text-right font-semibold sm:table-cell">
                  پخش
                </th>
                <th scope="col" className="px-5 py-3">
                  <span className="sr-only">عملیات</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {episodes.map((episode) => (
                <tr key={episode.id} className="transition-colors hover:bg-surface-2/50">
                  <td className="px-5 py-3.5">
                    <Link href={`/admin/episodes/${episode.id}`} className="font-semibold hover:text-brand-strong">
                      {episode.episodeNumber ? (
                        <span className="nums ml-2 text-ink-subtle">#{toFaDigits(episode.episodeNumber)}</span>
                      ) : null}
                      {episode.title}
                      {episode.featured ? (
                        <Star className="mr-1.5 inline size-3.5 fill-accent text-accent" aria-label="پیشنهادی" />
                      ) : null}
                    </Link>
                    <p className="mt-0.5 text-xs text-ink-subtle">{formatDurationLabel(episode.durationSeconds)}</p>
                    <div className="mt-1.5 md:hidden">
                      <EpisodeStatusBadge status={episode.status} publishedAt={episode.publishedAt} />
                    </div>
                  </td>
                  <td className="hidden px-3 py-3.5 md:table-cell">
                    <EpisodeStatusBadge status={episode.status} publishedAt={episode.publishedAt} />
                  </td>
                  <td className="hidden px-3 py-3.5 text-ink-muted lg:table-cell">
                    {episode.publishedAt ? formatDate(episode.publishedAt) : "—"}
                  </td>
                  <td className="nums hidden px-3 py-3.5 text-ink-muted sm:table-cell">
                    <span className="inline-flex items-center gap-1">
                      <Headphones className="size-3.5" aria-hidden="true" />
                      {toFaDigits(episode.playCount)}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-left">
                    {episode.status === "PUBLISHED" ? (
                      <Link
                        href={`/episodes/${episode.slug}`}
                        target="_blank"
                        aria-label={`مشاهده‌ی «${episode.title}» در سایت`}
                        className="inline-grid size-8 place-items-center rounded-lg text-ink-subtle hover:bg-surface-2 hover:text-ink"
                      >
                        <ExternalLink className="size-4" aria-hidden="true" />
                      </Link>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
