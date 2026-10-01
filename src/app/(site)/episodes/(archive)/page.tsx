import { Search, X } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { JsonLd } from "@/components/seo/json-ld";
import { EpisodeCard } from "@/components/site/episode-card";
import { PageHeader } from "@/components/site/page-header";
import { Pagination } from "@/components/site/pagination";
import { buttonStyles } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { breadcrumbSchema, collectionPageSchema, graph, podcastSeriesSchema } from "@/lib/structured-data";
import { cn, toFaDigits } from "@/lib/utils";
import { getEpisodes } from "@/server/episodes";
import { getCategories, getLenses, getTagBySlug } from "@/server/taxonomy";

export const metadata: Metadata = {
  title: "همه‌ی اپیزودها",
  description: `آرشیو کامل اپیزودهای ${siteConfig.name}؛ جست‌وجو و فیلتر بر اساس دسته، دریچه، برچسب، عنوان یا محتوای اپیزود.`,
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
  const category = readOne(params.category);
  const lens = readOne(params.lens);
  const tag = readOne(params.tag);
  const sort = readOne(params.sort) === "oldest" ? "oldest" : "newest";
  const page = Math.max(1, Number(readOne(params.page) ?? 1) || 1);

  const [{ episodes, total, pageCount }, categories, lenses, activeTag] = await Promise.all([
    getEpisodes({ page, category, lens, tag, search, sort }),
    getCategories(),
    getLenses(),
    tag ? getTagBySlug(tag) : null,
  ]);

  const buildHref = (overrides: Record<string, string | number | undefined>) => {
    const next = new URLSearchParams();
    const merged = { search, category, lens, tag, sort: sort === "newest" ? undefined : sort, page, ...overrides };

    for (const [key, value] of Object.entries(merged)) {
      if (value !== undefined && value !== "" && !(key === "page" && value === 1)) {
        next.set(key, String(value));
      }
    }

    const query = next.toString();
    return query ? `/episodes?${query}` : "/episodes";
  };

  const isFiltered = Boolean(search || category || lens || tag);

  return (
    <>
      <JsonLd
        data={graph(
          podcastSeriesSchema(),
          collectionPageSchema({
            name: "همه‌ی اپیزودها",
            description: `آرشیو کامل اپیزودهای ${siteConfig.name}.`,
            path: "/episodes",
            episodes,
          }),
          breadcrumbSchema([
            { name: "خانه", path: "/" },
            { name: "اپیزودها", path: "/episodes" },
          ]),
        )}
      />

      <PageHeader
        eyebrow="آرشیو"
        title="همه‌ی اپیزودها"
        lead="هر اپیزود سراغ یک مسئله‌ی مشخص در کار یا زندگی می‌رود. با جست‌وجو، دسته یا دریچه، آنچه را الان لازم دارید پیدا کنید."
      />

      <div className="container-page py-12 md:py-16">
        {/* Search */}
        <form method="get" action="/episodes" role="search" className="flex flex-wrap gap-3">
          {category ? <input type="hidden" name="category" value={category} /> : null}
          {lens ? <input type="hidden" name="lens" value={lens} /> : null}
          {tag ? <input type="hidden" name="tag" value={tag} /> : null}
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
              className="h-12 w-full rounded-xl border border-line-strong bg-surface pr-12 backdrop-blur-xl pl-4 text-[0.9375rem] placeholder:text-ink-subtle focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15"
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

        {/* Taxonomy filters */}
        <div className="mt-6 flex flex-col gap-3">
          {categories.length > 0 ? (
            <FilterRow label="دسته">
              <Link
                href={buildHref({ category: undefined, page: 1 })}
                aria-current={!category ? "true" : undefined}
                className={chipStyles(!category)}
              >
                همه
              </Link>
              {categories.map((item) => (
                <Link
                  key={item.slug}
                  href={buildHref({ category: item.slug, page: 1 })}
                  aria-current={category === item.slug ? "true" : undefined}
                  className={chipStyles(category === item.slug)}
                >
                  {item.name}
                  <span className="nums mr-1.5 text-xs opacity-60">{toFaDigits(item.episodeCount)}</span>
                </Link>
              ))}
            </FilterRow>
          ) : null}

          {lenses.length > 0 ? (
            <FilterRow label="دریچه">
              <Link
                href={buildHref({ lens: undefined, page: 1 })}
                aria-current={!lens ? "true" : undefined}
                className={chipStyles(!lens)}
              >
                همه
              </Link>
              {lenses.map((item) => (
                <Link
                  key={item.slug}
                  href={buildHref({ lens: item.slug, page: 1 })}
                  aria-current={lens === item.slug ? "true" : undefined}
                  className={chipStyles(lens === item.slug)}
                >
                  {item.name}
                  <span className="nums mr-1.5 text-xs opacity-60">{toFaDigits(item.episodeCount)}</span>
                </Link>
              ))}
            </FilterRow>
          ) : null}

          {tag ? (
            <FilterRow label="برچسب">
              <Link href={buildHref({ tag: undefined, page: 1 })} aria-current="true" className={chipStyles(true)}>
                {activeTag?.name ?? tag}
                <X className="mr-1.5 size-3.5" aria-label="حذف فیلتر برچسب" />
              </Link>
            </FilterRow>
          ) : null}
        </div>

        {/* Result summary + sort */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
          <p className="text-sm text-ink-muted" aria-live="polite">
            <span className="nums font-bold text-ink">{toFaDigits(total)}</span> اپیزود
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
              <li key={episode.id} className="reveal">
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

function FilterRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label={`فیلتر بر اساس ${label}`}>
      <span className="ml-1 w-12 shrink-0 text-sm text-ink-subtle">{label}</span>
      {children}
    </div>
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
    <div className="mt-8 rounded-2xl border border-dashed border-line-strong bg-surface px-6 py-20 backdrop-blur-xl text-center">
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
