import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/seo/json-ld";
import { EpisodeCard } from "@/components/site/episode-card";
import { PageHeader } from "@/components/site/page-header";
import { buttonStyles } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { breadcrumbSchema, collectionPageSchema, graph, personSchema } from "@/lib/structured-data";
import { toFaDigits, truncate } from "@/lib/utils";
import { getEpisodes } from "@/server/episodes";
import { getAllTopics, getTopicBySlug, getTopics } from "@/server/topics";

/**
 * Topic pages are the site's SEO pillars: a stable URL per theme, with the
 * long-form `body` above an always-current list of episodes that link into it.
 */
export async function generateStaticParams() {
  const topics = await getAllTopics();
  return topics.map((topic) => ({ slug: topic.slug }));
}

export async function generateMetadata({ params }: PageProps<"/topics/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const topic = await getTopicBySlug(slug);

  if (!topic) return { title: "موضوع پیدا نشد" };

  const title = topic.seoTitle || topic.name;
  const description =
    topic.seoDescription ||
    truncate(topic.description ?? topic.body ?? `اپیزودهای ${siteConfig.name} درباره‌ی ${topic.name}.`, 160);

  return {
    title,
    description,
    alternates: { canonical: `/topics/${topic.slug}` },
    openGraph: { title, description, url: `/topics/${topic.slug}` },
  };
}

export default async function TopicPage({ params }: PageProps<"/topics/[slug]">) {
  const { slug } = await params;
  const topic = await getTopicBySlug(slug);

  if (!topic) notFound();

  const [{ episodes, total }, allTopics] = await Promise.all([
    getEpisodes({ topic: topic.slug, perPage: 50 }),
    getTopics(),
  ]);

  const otherTopics = allTopics.filter((item) => item.slug !== topic.slug);

  return (
    <>
      <JsonLd
        data={graph(
          personSchema(),
          collectionPageSchema({
            name: topic.name,
            description: topic.description ?? siteConfig.description,
            path: `/topics/${topic.slug}`,
            episodes,
          }),
          breadcrumbSchema([
            { name: "خانه", path: "/" },
            { name: "موضوع‌ها", path: "/topics" },
            { name: topic.name, path: `/topics/${topic.slug}` },
          ]),
        )}
      />

      <PageHeader eyebrow="موضوع" title={topic.name} lead={topic.description ?? undefined}>
        <nav aria-label="مسیر صفحه" className="mt-8">
          <ol className="flex flex-wrap items-center gap-1.5 text-sm text-ink-subtle">
            <li>
              <Link href="/" className="transition-colors hover:text-brand-strong">
                خانه
              </Link>
            </li>
            <ChevronLeft className="size-3.5" aria-hidden="true" />
            <li>
              <Link href="/topics" className="transition-colors hover:text-brand-strong">
                موضوع‌ها
              </Link>
            </li>
            <ChevronLeft className="size-3.5" aria-hidden="true" />
            <li className="font-medium text-ink-muted" aria-current="page">
              {topic.name}
            </li>
          </ol>
        </nav>
      </PageHeader>

      <div className="container-page py-12 md:py-16">
        {topic.body ? (
          <div className="rich-text max-w-2xl text-[1.0625rem]">
            <p>{topic.body}</p>
          </div>
        ) : null}

        <div className="mt-12 flex items-baseline justify-between gap-4 border-b border-line pb-4">
          <h2 className="text-2xl">اپیزودهای این موضوع</h2>
          <p className="nums text-sm text-ink-muted">{toFaDigits(total)} اپیزود</p>
        </div>

        {episodes.length === 0 ? (
          <p className="mt-8 rounded-2xl border border-dashed border-line-strong bg-surface px-6 py-16 text-center text-ink-muted">
            هنوز اپیزودی با این موضوع منتشر نشده است.
          </p>
        ) : (
          <ul className="mt-8 flex flex-col gap-4">
            {episodes.map((episode) => (
              <li key={episode.id}>
                <EpisodeCard episode={episode} layout="row" />
              </li>
            ))}
          </ul>
        )}

        {/* Internal links out to sibling topics keep crawl depth shallow. */}
        {otherTopics.length > 0 ? (
          <section aria-labelledby="other-topics" className="mt-16 border-t border-line pt-10">
            <h2 id="other-topics" className="text-lg font-bold">
              موضوع‌های دیگر
            </h2>
            <ul className="mt-5 flex flex-wrap gap-2">
              {otherTopics.map((item) => (
                <li key={item.id}>
                  <Link
                    href={`/topics/${item.slug}`}
                    className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium text-ink-muted transition-colors hover:border-brand hover:text-brand-strong"
                  >
                    {item.name}
                    <span className="nums text-xs opacity-60">{toFaDigits(item.episodeCount)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <div className="mt-14 rounded-2xl border border-line bg-brand-soft p-8 text-center">
          <h2 className="text-xl font-bold text-brand-strong">
            این موضوع در تیم شما هم مسئله است؟
          </h2>
          <p className="mx-auto mt-3 max-w-lg leading-loose text-ink-muted">
            همین بحث را به شکل کارگاه، کوچینگ تیمی یا مشاوره‌ی سازمانی برای تیم شما اجرا می‌کنم.
          </p>
          <Link href="/contact" className={buttonStyles({ size: "lg", className: "mt-6" })}>
            شروع گفت‌وگو
          </Link>
        </div>
      </div>
    </>
  );
}
