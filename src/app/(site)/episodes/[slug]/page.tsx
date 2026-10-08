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
import {
  breadcrumbSchema,
  graph,
  personSchema,
  podcastEpisodeSchema,
  podcastSeriesSchema,
} from "@/lib/structured-data";
import { sanitizeHtml } from "@/lib/sanitize";
import { absoluteUrl, pageMetadata } from "@/lib/seo";
import { decodeSlug, formatDate, formatDurationLabel, toFaDigits, toISODate, truncate } from "@/lib/utils";
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
  const slug = decodeSlug((await params).slug);
  const episode = await getEpisodeBySlug(slug);

  if (!episode) return { title: "اپیزود پیدا نشد" };

  // Without a cover, the share image is this route's own opengraph-image.tsx.
  return pageMetadata({
    title: episode.seoTitle || episode.title,
    description: episode.seoDescription || truncate(episode.description, 160),
    path: `/episodes/${episode.slug}`,
    type: "article",
    image: episode.coverImage ?? false,
    publishedTime: episode.publishedAt?.toISOString(),
  });
}

export default async function EpisodePage({ params }: PageProps<"/episodes/[slug]">) {
  const slug = decodeSlug((await params).slug);
  const episode = await getEpisodeBySlug(slug);

  if (!episode) notFound();

  const lenses = episode.lenses.map((link) => link.lens);
  const tags = episode.tags.map((link) => link.tag);
  const related = await getRelatedEpisodes({
    id: episode.id,
    categoryId: episode.category?.id ?? null,
    tagIds: tags.map((tag) => tag.id),
  });
  const keywords = [episode.category?.name, ...lenses.map((lens) => lens.name), ...tags.map((tag) => tag.name)].filter(
    (name): name is string => Boolean(name),
  );
  const track = toPlayerTrack(episode);
  const url = absoluteUrl(`/episodes/${episode.slug}`);

  return (
    <>
      <JsonLd
        data={graph(
          personSchema(),
          podcastSeriesSchema(),
          podcastEpisodeSchema({ ...episode, keywords }),
          breadcrumbSchema([
            { name: "خانه", path: "/" },
            { name: "اپیزودها", path: "/episodes" },
            { name: episode.title, path: `/episodes/${episode.slug}` },
          ]),
        )}
      />

      <article>
        <header className="border-b border-line">
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
              {episode.category ? (
                <Link
                  href={`/categories/${episode.category.slug}`}
                  className="rounded-full bg-brand-soft px-3 py-1 font-semibold text-brand-strong transition-colors hover:bg-brand hover:text-brand-contrast"
                >
                  {episode.category.name}
                </Link>
              ) : null}
              {episode.episodeNumber ? (
                <span className="nums inline-flex items-center gap-1.5 font-semibold text-brand-strong">
                  <Hash className="size-4" aria-hidden="true" />
                  اپیزود {toFaDigits(episode.episodeNumber)}
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

            {lenses.length > 0 || tags.length > 0 ? (
              <div className="mt-8 flex flex-col gap-3">
                {lenses.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="text-ink-subtle">از دریچه‌ی</span>
                    <ul className="flex flex-wrap gap-2">
                      {lenses.map((lens) => (
                        <li key={lens.slug}>
                          <Link
                            href={`/episodes?lens=${encodeURIComponent(lens.slug)}`}
                            className="inline-block rounded-full border border-line bg-canvas px-3.5 py-1.5 font-medium text-ink-muted transition-colors hover:border-brand hover:text-brand-strong"
                          >
                            {lens.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {tags.length > 0 ? (
                  <ul className="flex flex-wrap gap-2 text-sm" aria-label="برچسب‌ها">
                    {tags.map((tag) => (
                      <li key={tag.slug}>
                        <Link
                          href={`/tags/${tag.slug}`}
                          className="inline-block rounded-full px-2 py-1 text-ink-subtle transition-colors hover:text-brand-strong"
                        >
                          #{tag.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}
          </div>
        </header>

        <div className="container-page grid gap-12 py-12 md:py-16 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="min-w-0">
            {/* Long-form reading sits on glass so the backdrop never fights the text. */}
            <div className="glass rich-text max-w-2xl rounded-3xl p-6 text-[1.0625rem] md:p-10">
              <p className="text-xl leading-loose text-ink">{episode.description}</p>
              {episode.showNotes ? (
                <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(episode.showNotes) }} />
              ) : null}
            </div>

            {episode.transcript ? (
              <details className="glass mt-8 max-w-2xl rounded-2xl p-6">
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

            {/* A quiet pointer only — the offer itself lives on /collaborate. */}
            <p className="px-1 text-sm leading-loose text-ink-subtle">
              این مسئله در سازمان شما هم هست؟{" "}
              <Link href="/collaborate" className="font-semibold text-ink-muted underline underline-offset-4 hover:text-brand-strong">
                درباره‌ی همکاری
              </Link>
            </p>
          </aside>
        </div>

        {related.length > 0 ? (
          <section aria-labelledby="related-heading" className="border-t border-line">
            <div className="container-page py-14 md:py-20">
              <h2 id="related-heading" className="text-2xl md:text-3xl">
                اپیزودهای مرتبط
              </h2>
              <ul className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {related.map((item) => (
                  <li key={item.id} className="reveal flex">
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
