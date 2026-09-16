import { ArrowLeft, Clock } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PlayButton } from "@/components/player/play-button";
import { JsonLd } from "@/components/seo/json-ld";
import { EpisodeCard } from "@/components/site/episode-card";
import { SectionHeading } from "@/components/site/page-header";
import { SubscribeStrip } from "@/components/site/subscribe-strip";
import { buttonStyles } from "@/components/ui/button";
import { disciplines, problemAreas, services } from "@/config/services";
import { siteConfig } from "@/config/site";
import {
  graph,
  personSchema,
  podcastSeriesSchema,
  professionalServiceSchema,
  websiteSchema,
} from "@/lib/structured-data";
import { formatDate, formatDurationLabel, toFaDigits, toISODate } from "@/lib/utils";
import { getFeaturedEpisode, getLatestEpisodes, toPlayerTrack } from "@/server/episodes";
import { getTopics } from "@/server/topics";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const [featured, latest, topics] = await Promise.all([
    getFeaturedEpisode(),
    getLatestEpisodes(7),
    getTopics(),
  ]);

  // Keep the hero episode out of the grid below it.
  const recent = latest.filter((episode) => episode.id !== featured?.id).slice(0, 6);

  return (
    <>
      <JsonLd
        data={graph(
          personSchema(),
          websiteSchema(),
          podcastSeriesSchema(),
          professionalServiceSchema(services.map((s) => ({ name: s.title, description: s.summary }))),
        )}
      />

      {/* ---------------------------------------------------------------- hero */}
      <section className="relative overflow-hidden border-b border-line">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(60rem_35rem_at_85%_-10%,var(--brand-soft),transparent_65%)]"
        />

        <div className="container-page relative grid gap-12 py-16 md:py-24 lg:grid-cols-[1.45fr_1fr] lg:items-center xl:gap-16">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-1.5 text-sm font-semibold text-brand-strong">
              <span className="size-2 rounded-full bg-accent" aria-hidden="true" />
              پادکست {siteConfig.name}
            </p>

            <h1 className="mt-6 text-[2.25rem] leading-[1.4] sm:text-5xl lg:text-[2.625rem] xl:text-5xl">
              مسئله‌های آدم‌ها در کار،{" "}
              {/* The line break only helps once there is room for each clause. */}
              <br className="hidden sm:block" />
              از <span className="text-brand-strong">زاویه‌ای</span> که کمتر دیده می‌شود.
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
              <Link href="/collaborate" className={buttonStyles({ variant: "outline", size: "lg" })}>
                همکاری با تیم شما
              </Link>
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
            <div className="rounded-3xl border border-line bg-surface p-7 shadow-card md:p-8">
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
          ) : null}
        </div>
      </section>

      {/* ------------------------------------------------------- problem areas */}
      <section aria-labelledby="problems-heading" className="border-b border-line bg-surface">
        <div className="container-page py-16 md:py-24">
          <SectionHeading
            title="این پادکست سراغ چه چیزی می‌رود؟"
            description="سه دسته مسئله که در هر سازمانی تکرار می‌شوند و کمتر ریشه‌ای به آن‌ها پرداخته می‌شود."
          />
          <h2 id="problems-heading" className="sr-only">
            موضوع‌های اصلی
          </h2>

          <ul className="mt-10 grid gap-6 md:grid-cols-3">
            {problemAreas.map((area, index) => (
              <li key={area.title} className="rounded-2xl border border-line bg-canvas p-7">
                <span className="nums grid size-9 place-items-center rounded-lg bg-brand-soft text-sm font-bold text-brand-strong">
                  {toFaDigits(index + 1)}
                </span>
                <h3 className="mt-5 text-lg font-bold">{area.title}</h3>
                <p className="mt-3 leading-loose text-ink-muted">{area.body}</p>
              </li>
            ))}
          </ul>
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
                <li key={episode.id} className="flex">
                  <EpisodeCard episode={episode} className="w-full" />
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {/* ------------------------------------------------------------- topics */}
      {topics.length > 0 ? (
        <section aria-labelledby="topics-heading" className="border-b border-line bg-surface">
          <div className="container-page py-16 md:py-24">
            <SectionHeading
              title="بر اساس موضوع بگردید"
              description="هر موضوع، مجموعه‌ای از اپیزودهایی است که یک مسئله را از زوایای مختلف باز می‌کنند."
            />
            <h2 id="topics-heading" className="sr-only">
              موضوع‌ها
            </h2>

            <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {topics.map((topic) => (
                <li key={topic.id}>
                  <Link
                    href={`/topics/${topic.slug}`}
                    className="group flex h-full flex-col rounded-2xl border border-line bg-canvas p-6 transition-all duration-300 hover:-translate-y-1 hover:border-brand hover:shadow-card"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-lg font-bold transition-colors group-hover:text-brand-strong">
                        {topic.name}
                      </h3>
                      <span className="nums shrink-0 rounded-full bg-surface-2 px-2.5 py-1 text-xs font-semibold text-ink-subtle">
                        {toFaDigits(topic.episodeCount)}
                      </span>
                    </div>
                    {topic.description ? (
                      <p className="mt-2.5 text-sm leading-loose text-ink-muted">{topic.description}</p>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {/* ---------------------------------------------------------- work with me */}
      <section aria-labelledby="work-heading" className="border-b border-line">
        <div className="container-page grid gap-12 py-16 md:py-24 lg:grid-cols-[1fr_1.1fr]">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <p className="text-sm font-bold text-brand-strong">برای سازمان‌ها</p>
            <h2 id="work-heading" className="mt-3 text-3xl leading-tight md:text-4xl">
              همین کار را با تیم شما هم انجام می‌دهم
            </h2>
            <p className="mt-5 leading-loose text-ink-muted">
              آنچه در پادکست می‌شنوید، خلاصه‌ی کاری است که در کوچینگ، کارگاه و مشاوره با تیم‌ها انجام
              می‌دهم: رسیدن به مسئله‌ی واقعی و ساختن مسیری که قابل اجرا باشد.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/contact" className={buttonStyles({ size: "lg" })}>
                دعوت به همکاری
              </Link>
              <Link href="/collaborate" className={buttonStyles({ variant: "outline", size: "lg" })}>
                جزئیات خدمات
              </Link>
            </div>
          </div>

          <ul className="grid gap-4 sm:grid-cols-2">
            {services.slice(0, 4).map((service) => (
              <li key={service.type} className="rounded-2xl border border-line bg-surface p-6">
                <h3 className="text-lg font-bold">{service.title}</h3>
                <p className="mt-2.5 text-sm leading-loose text-ink-muted">{service.summary}</p>
                <p className="mt-4 text-xs font-medium text-ink-subtle">{service.audience}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------------------------------------------------------- subscribe */}
      <section className="bg-surface">
        <div className="container-page py-16 md:py-20">
          <SubscribeStrip className="mx-auto max-w-2xl bg-canvas text-center" />
        </div>
      </section>
    </>
  );
}
