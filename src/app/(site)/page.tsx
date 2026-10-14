import { ArrowLeft, Clock, Rss } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PlayButton } from "@/components/player/play-button";
import { JsonLd } from "@/components/seo/json-ld";
import { EpisodeCard } from "@/components/site/episode-card";
import { SectionHeading } from "@/components/site/page-header";
import { CoverArt } from "@/components/site/cover-art";
import { SubscribeStrip } from "@/components/site/subscribe-strip";
import { buttonStyles } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { episodeCover } from "@/lib/cover";
import { feedAlternate } from "@/lib/seo";
import { graph, personSchema, podcastSeriesSchema, websiteSchema } from "@/lib/structured-data";
import { formatDate, formatDurationLabel, toFaDigits, toISODate } from "@/lib/utils";
import { getFeaturedEpisode, getLatestEpisodes, toPlayerTrack } from "@/server/episodes";
import { getShowCover } from "@/server/show";
import { getCategories } from "@/server/taxonomy";

export const metadata: Metadata = {
  alternates: { canonical: "/", types: feedAlternate },
};

/**
 * Rendered per request rather than at build time.
 *
 * The production image is built without the production database — it lives on a
 * mounted disk and only exists at run time — so anything prerendered here would
 * be a snapshot of an empty database. The queries behind this page are a handful
 * of indexed SQLite reads on local disk, so serving it fresh costs nothing worth
 * caching. Detail pages (episode, category, tag) keep their static generation:
 * with no rows at build time generateStaticParams yields nothing, and each page
 * is generated on first request and then revalidated by the admin panel.
 */
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [featured, latest, categories, showCover] = await Promise.all([
    getFeaturedEpisode(),
    getLatestEpisodes(7),
    getCategories(),
    getShowCover(),
  ]);

  // Keep the hero episode out of the grid below it.
  const recent = latest.filter((episode) => episode.id !== featured?.id).slice(0, 6);

  return (
    <>
      <JsonLd
        data={graph(personSchema(), websiteSchema(), podcastSeriesSchema(showCover.image))}
      />

      {/* ---------------------------------------------------------------- hero */}
      {/* Name, cover and the way in; no copy about the show until its owner writes it. */}
      <section className="relative border-b border-line">
        <div className="container-page relative grid gap-12 py-14 md:py-20 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-center xl:gap-16">
          <div className="min-w-0">
            <p className="glass inline-flex items-center gap-2.5 rounded-full px-3.5 py-1.5 text-sm font-semibold text-brand-strong">
              <span className="on-air size-2 rounded-full bg-accent" aria-hidden="true" />
              پادکست
            </p>

            <h1 className="mt-6 text-5xl leading-tight sm:text-6xl">
              <span className="text-aurora">{siteConfig.name}</span>
            </h1>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Link href="/episodes" className={buttonStyles({ size: "lg" })}>
                همه‌ی اپیزودها
                <ArrowLeft className="size-4" aria-hidden="true" />
              </Link>
              <a href="#subscribe" className={buttonStyles({ variant: "outline", size: "lg" })}>
                <Rss className="size-4" aria-hidden="true" />
                دنبال‌کردن پادکست
              </a>
            </div>

            {/* Featured episode */}
            {featured ? (
              <div className="glass mt-12 flex max-w-2xl flex-col gap-5 rounded-3xl p-6 sm:flex-row sm:items-start md:p-7">
                {/* eslint-disable-next-line @next/next/no-img-element -- uploaded covers are served as-is */}
                <img
                  src={episodeCover(featured, showCover).image}
                  alt=""
                  className="aspect-square size-24 shrink-0 rounded-2xl bg-surface-2 object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">
                    <span className="rounded-full bg-accent-soft px-3 py-1 text-accent-ink">اپیزود پیشنهادی</span>
                  </p>

                  <h2 className="mt-4 text-2xl leading-snug">
                    <Link href={`/episodes/${featured.slug}`} className="transition-colors hover:text-brand-strong">
                      {featured.title}
                    </Link>
                  </h2>

                  <p className="mt-3 line-clamp-3 leading-loose text-ink-muted">{featured.description}</p>

                  <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-ink-subtle">
                    {featured.episodeNumber ? (
                      <span className="nums font-semibold text-brand-strong">اپیزود {toFaDigits(featured.episodeNumber)}</span>
                    ) : null}
                    {featured.publishedAt ? (
                      <time dateTime={toISODate(featured.publishedAt)}>{formatDate(featured.publishedAt)}</time>
                    ) : null}
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="size-3.5" aria-hidden="true" />
                      {formatDurationLabel(featured.durationSeconds)}
                    </span>
                  </div>

                  <div className="mt-6">
                    <PlayButton track={toPlayerTrack(featured, episodeCover(featured, showCover))} variant="full" />
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="relative isolate order-first mx-auto w-full max-w-72 rounded-3xl lg:order-none lg:max-w-none">
            <span className="orbit-glow" aria-hidden="true" />
            <CoverArt cover={showCover} alt={`کاور پادکست ${siteConfig.name}`} className="rounded-3xl shadow-lifted" />
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- latest episodes */}
      {recent.length > 0 ? (
        <section aria-labelledby="latest-heading" className="border-b border-line">
          <div className="container-page py-16 md:py-24">
            <SectionHeading
              id="latest-heading"
              title="تازه‌ترین اپیزودها"
              action={
                <Link
                  href="/episodes"
                  className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-strong transition-colors hover:text-brand"
                >
                  همه‌ی اپیزودها
                  <ArrowLeft className="size-4" aria-hidden="true" />
                </Link>
              }
            />

            <ul className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {recent.map((episode) => (
                <li key={episode.id} className="reveal flex">
                  <EpisodeCard episode={episode} className="w-full" />
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {/* --------------------------------------------------------- categories */}
      {categories.length > 0 ? (
        <section aria-labelledby="categories-heading" className="border-b border-line">
          <div className="container-page py-16 md:py-24">
            <SectionHeading
              id="categories-heading"
              title="دسته‌ها"
            />

            <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((category) => (
                <li key={category.id} className="reveal">
                  <Link
                    href={`/categories/${category.slug}`}
                    className="glass spotlight group flex h-full flex-col rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-lg font-bold transition-colors group-hover:text-brand-strong">
                        {category.name}
                      </h3>
                      <span className="nums chip-tint shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold">
                        {toFaDigits(category.episodeCount)}
                      </span>
                    </div>
                    {category.description ? (
                      <p className="mt-2.5 text-sm leading-loose text-ink-muted">{category.description}</p>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {/* ---------------------------------------------------------- subscribe */}
      <section id="subscribe" className="scroll-mt-24">
        <div className="container-page py-16 md:py-24">
          <SubscribeStrip className="reveal mx-auto max-w-2xl p-8 text-center md:p-10" />
        </div>
      </section>
    </>
  );
}
