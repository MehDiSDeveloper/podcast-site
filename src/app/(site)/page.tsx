import { ArrowLeft, Clock, Rss } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PlayButton } from "@/components/player/play-button";
import { JsonLd } from "@/components/seo/json-ld";
import { EpisodeCard } from "@/components/site/episode-card";
import { SectionHeading } from "@/components/site/page-header";
import { SubscribeStrip } from "@/components/site/subscribe-strip";
import { buttonStyles } from "@/components/ui/button";
import { disciplines, problemAreas } from "@/config/services";
import { siteConfig } from "@/config/site";
import {
  graph,
  personSchema,
  podcastSeriesSchema,
  websiteSchema,
} from "@/lib/structured-data";
import { formatDate, formatDurationLabel, toFaDigits, toISODate } from "@/lib/utils";
import { getFeaturedEpisode, getLatestEpisodes, toPlayerTrack } from "@/server/episodes";
import { getCategories } from "@/server/taxonomy";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
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
  const [featured, latest, categories] = await Promise.all([
    getFeaturedEpisode(),
    getLatestEpisodes(7),
    getCategories(),
  ]);

  // Keep the hero episode out of the grid below it.
  const recent = latest.filter((episode) => episode.id !== featured?.id).slice(0, 6);

  return (
    <>
      <JsonLd
        data={graph(personSchema(), websiteSchema(), podcastSeriesSchema())}
      />

      {/* ---------------------------------------------------------------- hero */}
      <section className="relative border-b border-line">
        <div className="container-page relative grid gap-12 py-16 md:py-28 lg:grid-cols-[1.45fr_1fr] lg:items-center xl:gap-16">
          <div>
            <p className="glass inline-flex items-center gap-2.5 rounded-full px-3.5 py-1.5 text-sm font-semibold text-brand-strong">
              <span className="on-air size-2 rounded-full bg-accent" aria-hidden="true" />
              پادکست {siteConfig.name}
            </p>

            <h1 className="mt-6 text-[2.25rem] leading-[1.4] sm:text-5xl lg:text-[2.625rem] xl:text-5xl">
              مسئله‌های آدم‌ها در کار،{" "}
              {/* The line break only helps once there is room for each clause. */}
              <br className="hidden sm:block" />
              از <span className="text-aurora">زاویه‌ای</span> که کمتر دیده می‌شود.
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-loose text-ink-muted">
              تعارض‌های تکرارشونده، انگیزه‌ای که ته می‌کشد، تصمیم‌هایی که گران تمام می‌شوند — هر
              اپیزود یک مسئله‌ی واقعی را با شواهدی از روان‌شناسی، علوم اعصاب، فلسفه و اقتصاد باز
              می‌کند و با چیزی قابل‌اجرا تمام می‌شود.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Link href="/episodes" className={buttonStyles({ size: "lg" })}>
                شنیدن اپیزودها
                <ArrowLeft className="size-4" aria-hidden="true" />
              </Link>
              <a href="#subscribe" className={buttonStyles({ variant: "outline", size: "lg" })}>
                <Rss className="size-4" aria-hidden="true" />
                دنبال‌کردن پادکست
              </a>
            </div>

            <ul className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-subtle">
              {disciplines.map((discipline) => (
                <li key={discipline} className="flex items-center gap-2">
                  <span className="size-1 rounded-full bg-ink-subtle" aria-hidden="true" />
                  {discipline}
                </li>
              ))}
            </ul>
          </div>

          {/* Featured episode */}
          {featured ? (
            <div className="relative isolate">
              <span className="orbit-glow" aria-hidden="true" />
            <div className="glass relative rounded-3xl p-7 md:p-8">
              <span className="orbit-ring" aria-hidden="true" />
              <p className="text-sm font-bold">
                <span className="rounded-full bg-accent-soft px-3 py-1 text-accent-ink">اپیزود پیشنهادی</span>
              </p>

              <h2 className="mt-5 text-2xl leading-snug">
                <Link href={`/episodes/${featured.slug}`} className="transition-colors hover:text-brand-strong">
                  {featured.title}
                </Link>
              </h2>

              <p className="mt-3 line-clamp-3 leading-loose text-ink-muted">{featured.description}</p>

              <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-ink-subtle">
                {featured.publishedAt ? (
                  <time dateTime={toISODate(featured.publishedAt)}>{formatDate(featured.publishedAt)}</time>
                ) : null}
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="size-3.5" aria-hidden="true" />
                  {formatDurationLabel(featured.durationSeconds)}
                </span>
              </div>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <PlayButton track={toPlayerTrack(featured)} variant="full" />
                <Link
                  href={`/episodes/${featured.slug}`}
                  className={buttonStyles({ variant: "ghost", size: "lg", className: "h-14" })}
                >
                  یادداشت‌های اپیزود
                </Link>
              </div>
            </div>
            </div>
          ) : null}
        </div>
      </section>

      {/* ---------------------------------------------------- latest episodes */}
      {recent.length > 0 ? (
        <section aria-labelledby="latest-heading" className="border-b border-line">
          <div className="container-page py-16 md:py-24">
            <SectionHeading
              title="تازه‌ترین اپیزودها"
              description="از هر کدام می‌توانید شروع کنید؛ اپیزودها به هم وابسته نیستند."
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

            <h2 id="latest-heading" className="sr-only">
              تازه‌ترین اپیزودها
            </h2>

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

      {/* ------------------------------------------------------- problem areas */}
      <section aria-labelledby="problems-heading" className="border-b border-line">
        <div className="container-page py-16 md:py-24">
          <SectionHeading
            title="این پادکست سراغ چه چیزی می‌رود؟"
            description="سه دسته مسئله که در هر سازمانی تکرار می‌شوند و کمتر ریشه‌ای به آن‌ها پرداخته می‌شود."
          />
          <h2 id="problems-heading" className="sr-only">
            مسئله‌های اصلی
          </h2>

          <ul className="mt-10 grid gap-6 md:grid-cols-3">
            {problemAreas.map((area, index) => (
              <li key={area.title} className="reveal glass spotlight rounded-2xl p-7">
                <span className="nums chip-tint grid size-10 place-items-center rounded-xl text-sm font-bold">
                  {toFaDigits(index + 1)}
                </span>
                <h3 className="mt-5 text-lg font-bold">{area.title}</h3>
                <p className="mt-3 leading-loose text-ink-muted">{area.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* --------------------------------------------------------- categories */}
      {categories.length > 0 ? (
        <section aria-labelledby="categories-heading" className="border-b border-line">
          <div className="container-page py-16 md:py-24">
            <SectionHeading
              title="بر اساس دسته بگردید"
              description="هر دسته، مجموعه‌ای از اپیزودهایی است که یک مواجهه را از زوایای مختلف باز می‌کنند."
            />
            <h2 id="categories-heading" className="sr-only">
              دسته‌ها
            </h2>

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
