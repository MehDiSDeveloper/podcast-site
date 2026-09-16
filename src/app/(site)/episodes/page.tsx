import { Search, X } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { EpisodeCard } from "@/components/site/episode-card";
import { PageHeader } from "@/components/site/page-header";
import { Pagination } from "@/components/site/pagination";
import { buttonStyles } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { getEpisodes } from "@/server/episodes";
import { getTopics } from "@/server/topics";

export const metadata: Metadata = {
  title: "همه‌ی اپیزودها",
  description: `آرشیو کامل اپیزودهای ${siteConfig.name}؛ جست‌وجو بر اساس موضوع، عنوان یا محتوای اپیزود.`,
  alternates: { canonical: "/episodes" },
  openGraph: {
    title: `همه‌ی اپیزودها | ${siteConfig.name}`,
    description: `آرشیو کامل اپیزودهای ${siteConfig.name}.`,
    url: "/episodes",
  },
};

export default async function EpisodesPage({ searchParams }: PageProps<"/episodes">) {
  const params = await searchParams;

  const readOne = (value: string | string[] | undefined) =>
    (Array.isArray(value) ? value[0] : value)?.trim() || undefined;

  const search = readOne(params.search);
  const topic = readOne(params.topic);
  const sort = readOne(params.sort) === "oldest" ? "oldest" : "newest";
  const page = Math.max(1, Number(readOne(params.page) ?? 1) || 1);

  const [{ episodes, total, pageCount }, topics] = await Promise.all([
    getEpisodes({ page, topic, search, sort }),
    getTopics(),
  ]);

  const buildHref = (overrides: Record<string, string | number | undefined>) => {
    const next = new URLSearchParams();
    const merged = { search, topic, sort: sort === "newest" ? undefined : sort, page, ...overrides };

    for (const [key, value] of Object.entries(merged)) {
      if (value !== undefined && value !== "" && !(key === "page" && value === 1)) {
        next.set(key, String(value));
      }
    }

    const query = next.toString();
    return query ? `/episodes?${query}` : "/episodes";
  };

  const isFiltered = Boolean(search || topic);

  return (
    <>
      <PageHeader
        eyebrow="آرشیو"
        title="همه‌ی اپیزودها"
        lead="هر اپیزود سراغ یک مسئله‌ی مشخص در کار یا زندگی می‌رود. با جست‌وجو یا موضوع، آنچه را الان لازم دارید پیدا کنید."
      />

      <div className="container-page py-12 md:py-16">
        {/* Search */}
        <form method="get" action="/episodes" role="search" className="flex flex-wrap gap-3">
          {topic ? <input type="hidden" name="topic" value={topic} /> : null}
          {sort === "oldest" ? <input type="hidden" name="sort" value="oldest" /> : null}

          <div className="relative flex-1 min-w-64">
            <Search
              className="pointer-events-none absolute inset-y-0 right-4 my-auto size-4.5 text-ink-subtle"
              aria-hidden="true"
            />
            <input
              type="search"
              name="search"
              defaultValue={search ?? ""}
              placeholder="جست‌وجو در عنوان و متن اپیزودها…"
              aria-label="جست‌وجو در اپیزودها"
              className="h-12 w-full rounded-xl border border-line-strong bg-surface pr-12 pl-4 text-[0.9375rem] placeholder:text-ink-subtle focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15"
            />
          </div>

          <button type="submit" className={buttonStyles({ size: "lg", className: "h-12" })}>
            جست‌وجو
          </button>

          {isFiltered ? (
            <Link href="/episodes" className={buttonStyles({ variant: "ghost", size: "lg", className: "h-12" })}>
              <X className="size-4" aria-hidden="true" />
              حذف فیلترها
            </Link>
          ) : null}
        </form>

        {/* Topic filters */}
        {topics.length > 0 ? (
          <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="فیلتر بر اساس موضوع">
            <Link
              href={buildHref({ topic: undefined, page: 1 })}
              aria-current={!topic ? "true" : undefined}
              className={chipStyles(!topic)}
            >
              همه
            </Link>
            {topics.map((item) => (
              <Link
                key={item.slug}
                href={buildHref({ topic: item.slug, page: 1 })}
                aria-current={topic === item.slug ? "true" : undefined}
                className={chipStyles(topic === item.slug)}
              >
                {item.name}
                <span className="nums mr-1.5 text-xs opacity-60">{item.episodeCount}</span>
              </Link>
            ))}
          </div>
        ) : null}

        {/* Result summary + sort */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
          <p className="text-sm text-ink-muted" aria-live="polite">
            <span className="nums font-bold text-ink">{total}</span> اپیزود
            {search ? <> برای «{search}»</> : null}
          </p>
          <div className="flex items-center gap-1 text-sm">
            <span className="text-ink-subtle">ترتیب:</span>
            <Link
              href={buildHref({ sort: undefined, page: 1 })}
              className={sortStyles(sort === "newest")}
              aria-current={sort === "newest" ? "true" : undefined}
            >
              تازه‌ترین
            </Link>
            <Link
              href={buildHref({ sort: "oldest", page: 1 })}
              className={sortStyles(sort === "oldest")}
              aria-current={sort === "oldest" ? "true" : undefined}
            >
              قدیمی‌ترین
            </Link>
          </div>
        </div>

        {episodes.length === 0 ? (
          <EmptyState isFiltered={isFiltered} />
        ) : (
          <ul className="mt-8 flex flex-col gap-4">
            {episodes.map((episode) => (
              <li key={episode.id}>
                <EpisodeCard episode={episode} layout="row" />
              </li>
            ))}
          </ul>
        )}

        <Pagination page={page} pageCount={pageCount} buildHref={(next) => buildHref({ page: next })} />
      </div>
    </>
  );
}

function chipStyles(active: boolean) {
  return cn(
    "inline-flex items-center rounded-full border px-4 py-2 text-sm font-medium transition-colors",
    active
      ? "border-brand bg-brand-soft text-brand-strong"
      : "border-line bg-surface text-ink-muted hover:border-line-strong hover:text-ink",
  );
}

function sortStyles(active: boolean) {
  return cn(
    "rounded-lg px-2.5 py-1.5 font-medium transition-colors",
    active ? "bg-surface-2 text-ink" : "text-ink-subtle hover:text-ink",
  );
}

function EmptyState({ isFiltered }: { isFiltered: boolean }) {
  return (
    <div className="mt-8 rounded-2xl border border-dashed border-line-strong bg-surface px-6 py-20 text-center">
      <p className="text-lg font-bold">اپیزودی پیدا نشد</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-loose text-ink-muted">
        {isFiltered
          ? "با این فیلترها چیزی پیدا نکردیم. عبارت دیگری را امتحان کنید یا فیلترها را بردارید."
          : "هنوز اپیزودی منتشر نشده است. به‌زودی اینجا خبری خواهد بود."}
      </p>
      {isFiltered ? (
        <Link href="/episodes" className={buttonStyles({ variant: "outline", className: "mt-6" })}>
          نمایش همه‌ی اپیزودها
        </Link>
      ) : null}
    </div>
  );
}
