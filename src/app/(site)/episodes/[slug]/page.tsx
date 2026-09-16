import { ChevronLeft, Clock, Calendar, Hash } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PlayButton } from "@/components/player/play-button";
import { JsonLd } from "@/components/seo/json-ld";
import { EpisodeCard } from "@/components/site/episode-card";
import { ShareRow } from "@/components/site/share-row";
import { SubscribeStrip } from "@/components/site/subscribe-strip";
import { buttonStyles } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import {
  breadcrumbSchema,
  graph,
  personSchema,
  podcastEpisodeSchema,
  podcastSeriesSchema,
} from "@/lib/structured-data";
import { sanitizeHtml } from "@/lib/sanitize";
import { formatDate, formatDurationLabel, toISODate, truncate } from "@/lib/utils";
import {
  getAllPublishedEpisodes,
  getEpisodeBySlug,
  getRelatedEpisodes,
  toPlayerTrack,
} from "@/server/episodes";

/**
 * Episode pages are prerendered at build time and refreshed by
 * `revalidatePath` whenever the admin saves an episode.
 */
export async function generateStaticParams() {
  const episodes = await getAllPublishedEpisodes();
  return episodes.map((episode) => ({ slug: episode.slug }));
}

export async function generateMetadata({ params }: PageProps<"/episodes/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const episode = await getEpisodeBySlug(slug);

  if (!episode) return { title: "اپیزود پیدا نشد" };

  const title = episode.seoTitle || episode.title;
  const description = episode.seoDescription || truncate(episode.description, 160);
  const url = `/episodes/${episode.slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title,
      description,
      url,
      publishedTime: episode.publishedAt ? toISODate(episode.publishedAt) : undefined,
      authors: [siteConfig.author.name],
      ...(episode.coverImage ? { images: [{ url: episode.coverImage }] } : {}),
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function EpisodePage({ params }: PageProps<"/episodes/[slug]">) {
  const { slug } = await params;
  const episode = await getEpisodeBySlug(slug);

  if (!episode) notFound();

  const topics = episode.topics.map((link) => link.topic);
  const related = await getRelatedEpisodes(
    episode.id,
    topics.map((topic) => topic.id),
  );
  const track = toPlayerTrack(episode);
  const url = `${siteConfig.url}/episodes/${episode.slug}`;

  return (
    <>
      <JsonLd
        data={graph(
          personSchema(),
          podcastSeriesSchema(),
          podcastEpisodeSchema({ ...episode, topics }),
          breadcrumbSchema([
            { name: "خانه", path: "/" },
            { name: "اپیزودها", path: "/episodes" },
            { name: episode.title, path: `/episodes/${episode.slug}` },
          ]),
        )}
      />

      <article>
        <header className="border-b border-line bg-surface">
          <div className="container-page py-10 md:py-14">
            <nav aria-label="مسیر صفحه" className="mb-8">
              <ol className="flex flex-wrap items-center gap-1.5 text-sm text-ink-subtle">
                <li>
                  <Link href="/" className="transition-colors hover:text-brand-strong">
                    خانه
                  </Link>
                </li>
                <ChevronLeft className="size-3.5" aria-hidden="true" />
                <li>
                  <Link href="/episodes" className="transition-colors hover:text-brand-strong">
                    اپیزودها
                  </Link>
                </li>
                <ChevronLeft className="size-3.5" aria-hidden="true" />
                <li className="truncate font-medium text-ink-muted" aria-current="page">
                  {episode.title}
                </li>
              </ol>
            </nav>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-subtle">
              {episode.episodeNumber ? (
                <span className="nums inline-flex items-center gap-1.5 font-semibold text-brand-strong">
                  <Hash className="size-4" aria-hidden="true" />
                  اپیزود {episode.episodeNumber}
                </span>
              ) : null}
              {episode.publishedAt ? (
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="size-4" aria-hidden="true" />
                  <time dateTime={toISODate(episode.publishedAt)}>{formatDate(episode.publishedAt)}</time>
                </span>
              ) : null}
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-4" aria-hidden="true" />
                {formatDurationLabel(episode.durationSeconds)}
              </span>
            </div>

            <h1 className="mt-4 max-w-4xl text-4xl leading-tight md:text-5xl">{episode.title}</h1>
            {episode.subtitle ? (
              <p className="mt-3 max-w-2xl text-xl text-ink-muted">{episode.subtitle}</p>
            ) : null}

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <PlayButton track={track} variant="full" />
              <a
                href={episode.audioUrl}
                download
                className={buttonStyles({ variant: "outline", size: "lg", className: "h-14" })}
              >
                دانلود فایل صوتی
              </a>
            </div>

            {topics.length > 0 ? (
              <ul className="mt-8 flex flex-wrap gap-2">
                {topics.map((topic) => (
                  <li key={topic.slug}>
                    <Link
                      href={`/topics/${topic.slug}`}
                      className="inline-block rounded-full border border-line bg-canvas px-3.5 py-1.5 text-sm font-medium text-ink-muted transition-colors hover:border-brand hover:text-brand-strong"
                    >
                      {topic.name}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </header>

        <div className="container-page grid gap-12 py-12 md:py-16 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="min-w-0">
            <div className="rich-text max-w-2xl text-[1.0625rem]">
              <p className="text-xl leading-loose text-ink">{episode.description}</p>
              {episode.showNotes ? (
                <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(episode.showNotes) }} />
              ) : null}
            </div>

            {episode.transcript ? (
              <details className="mt-12 max-w-2xl rounded-2xl border border-line bg-surface p-6">
                <summary className="cursor-pointer text-lg font-bold">متن کامل اپیزود</summary>
                <div className="rich-text mt-6 text-base">
                  {episode.transcript.split("\n\n").map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>
              </details>
            ) : null}

            <ShareRow url={url} title={episode.title} className="mt-12 max-w-2xl" />
          </div>

          <aside className="flex flex-col gap-6 lg:sticky lg:top-24 lg:self-start">
            <SubscribeStrip />

            <div className="rounded-2xl border border-line bg-brand-soft p-6">
              <h2 className="text-lg font-bold text-brand-strong">این موضوع برای تیم شما آشناست؟</h2>
              <p className="mt-2.5 text-sm leading-loose text-ink-muted">
                همین بحث‌ها را به شکل کارگاه، کوچینگ تیمی یا مشاوره‌ی سازمانی هم اجرا می‌کنم.
              </p>
              <Link href="/contact" className={buttonStyles({ className: "mt-5 w-full" })}>
                شروع گفت‌وگو
              </Link>
            </div>
          </aside>
        </div>

        {related.length > 0 ? (
          <section aria-labelledby="related-heading" className="border-t border-line bg-surface">
            <div className="container-page py-14 md:py-20">
              <h2 id="related-heading" className="text-2xl md:text-3xl">
                اپیزودهای مرتبط
              </h2>
              <ul className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {related.map((item) => (
                  <li key={item.id} className="flex">
                    <EpisodeCard episode={item} className="w-full" />
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ) : null}
      </article>
    </>
  );
}
