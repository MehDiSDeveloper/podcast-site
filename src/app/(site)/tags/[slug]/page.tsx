import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/seo/json-ld";
import { EpisodeCard } from "@/components/site/episode-card";
import { PageHeader } from "@/components/site/page-header";
import { siteConfig } from "@/config/site";
import { pageMetadata } from "@/lib/seo";
import { breadcrumbSchema, collectionPageSchema, graph, personSchema } from "@/lib/structured-data";
import { decodeSlug, toFaDigits } from "@/lib/utils";
import { getEpisodes } from "@/server/episodes";
import { getTagBySlug, getTags } from "@/server/taxonomy";

export async function generateStaticParams() {
  const tags = await getTags();
  return tags.map((tag) => ({ slug: tag.slug }));
}

export async function generateMetadata({ params }: PageProps<"/tags/[slug]">): Promise<Metadata> {
  const slug = decodeSlug((await params).slug);
  const tag = await getTagBySlug(slug);

  if (!tag) return { title: "برچسب پیدا نشد" };

  const title = `اپیزودهای «${tag.name}»`;
  const description = `همه‌ی اپیزودهای ${siteConfig.name} با برچسب «${tag.name}».`;

  return pageMetadata({ title, description, path: `/tags/${tag.slug}` });
}

export default async function TagPage({ params }: PageProps<"/tags/[slug]">) {
  const slug = decodeSlug((await params).slug);
  const tag = await getTagBySlug(slug);

  if (!tag) notFound();

  const { episodes, total } = await getEpisodes({ tag: tag.slug, perPage: 50 });

  return (
    <>
      <JsonLd
        data={graph(
          personSchema(),
          collectionPageSchema({
            name: tag.name,
            description: `اپیزودهای ${siteConfig.name} با برچسب «${tag.name}».`,
            path: `/tags/${tag.slug}`,
            episodes,
          }),
          breadcrumbSchema([
            { name: "خانه", path: "/" },
            { name: "اپیزودها", path: "/episodes" },
            { name: tag.name, path: `/tags/${tag.slug}` },
          ]),
        )}
      />

      <PageHeader eyebrow="برچسب" title={tag.name}>
        <nav aria-label="مسیر صفحه" className="mt-8">
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
            <li className="font-medium text-ink-muted" aria-current="page">
              {tag.name}
            </li>
          </ol>
        </nav>
      </PageHeader>

      <div className="container-page py-12 md:py-16">
        <div className="flex items-baseline justify-between gap-4 border-b border-line pb-4">
          <h2 className="text-2xl">اپیزودهای این برچسب</h2>
          <p className="nums text-sm text-ink-muted">{toFaDigits(total)} اپیزود</p>
        </div>

        {episodes.length === 0 ? (
          <p className="mt-8 rounded-2xl border border-dashed border-line-strong bg-surface px-6 backdrop-blur-xl py-16 text-center text-ink-muted">
            هنوز اپیزودی با این برچسب منتشر نشده است.
          </p>
        ) : (
          <ul className="mt-8 flex flex-col gap-4">
            {episodes.map((episode) => (
              <li key={episode.id} className="reveal">
                <EpisodeCard episode={episode} layout="row" />
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
