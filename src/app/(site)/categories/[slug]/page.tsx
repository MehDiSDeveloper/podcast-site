import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/seo/json-ld";
import { EpisodeCard } from "@/components/site/episode-card";
import { PageHeader } from "@/components/site/page-header";
import { SubscribeStrip } from "@/components/site/subscribe-strip";
import { siteConfig } from "@/config/site";
import { pageMetadata } from "@/lib/seo";
import { breadcrumbSchema, collectionPageSchema, graph, personSchema } from "@/lib/structured-data";
import { decodeSlug, toFaDigits, truncate } from "@/lib/utils";
import { getEpisodes } from "@/server/episodes";
import { getAllCategories, getCategories, getCategoryBySlug } from "@/server/taxonomy";

/**
 * Category pages are the site's SEO pillars: a stable URL per theme, with the
 * long-form `body` above an always-current list of episodes that link into it.
 */
export async function generateStaticParams() {
  const categories = await getAllCategories();
  return categories.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({ params }: PageProps<"/categories/[slug]">): Promise<Metadata> {
  const slug = decodeSlug((await params).slug);
  const category = await getCategoryBySlug(slug);

  if (!category) return { title: "دسته پیدا نشد" };

  const title = category.seoTitle || category.name;
  const description =
    category.seoDescription ||
    truncate(category.description ?? category.body ?? `اپیزودهای ${siteConfig.name} در دسته‌ی ${category.name}.`, 160);

  return pageMetadata({ title, description, path: `/categories/${category.slug}` });
}

export default async function CategoryPage({ params }: PageProps<"/categories/[slug]">) {
  const slug = decodeSlug((await params).slug);
  const category = await getCategoryBySlug(slug);

  if (!category) notFound();

  const [{ episodes, total }, allCategories] = await Promise.all([
    getEpisodes({ category: category.slug, perPage: 50 }),
    getCategories(),
  ]);

  const otherCategories = allCategories.filter((item) => item.slug !== category.slug);

  return (
    <>
      <JsonLd
        data={graph(
          personSchema(),
          collectionPageSchema({
            name: category.name,
            description: category.description ?? siteConfig.description,
            path: `/categories/${category.slug}`,
            episodes,
          }),
          breadcrumbSchema([
            { name: "خانه", path: "/" },
            { name: "دسته‌ها", path: "/categories" },
            { name: category.name, path: `/categories/${category.slug}` },
          ]),
        )}
      />

      <PageHeader eyebrow="دسته" title={category.name} lead={category.description ?? undefined}>
        <nav aria-label="مسیر صفحه" className="mt-8">
          <ol className="flex flex-wrap items-center gap-1.5 text-sm text-ink-subtle">
            <li>
              <Link href="/" className="transition-colors hover:text-brand-strong">
                خانه
              </Link>
            </li>
            <ChevronLeft className="size-3.5" aria-hidden="true" />
            <li>
              <Link href="/categories" className="transition-colors hover:text-brand-strong">
                دسته‌ها
              </Link>
            </li>
            <ChevronLeft className="size-3.5" aria-hidden="true" />
            <li className="font-medium text-ink-muted" aria-current="page">
              {category.name}
            </li>
          </ol>
        </nav>
      </PageHeader>

      <div className="container-page py-12 md:py-16">
        {category.body ? (
          <div className="rich-text max-w-2xl text-[1.0625rem]">
            <p>{category.body}</p>
          </div>
        ) : null}

        <div className="mt-12 flex items-baseline justify-between gap-4 border-b border-line pb-4">
          <h2 className="text-2xl">اپیزودهای این دسته</h2>
          <p className="nums text-sm text-ink-muted">{toFaDigits(total)} اپیزود</p>
        </div>

        {episodes.length === 0 ? (
          <p className="mt-8 rounded-2xl border border-dashed border-line-strong bg-surface px-6 backdrop-blur-xl py-16 text-center text-ink-muted">
            هنوز اپیزودی در این دسته منتشر نشده است.
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

        {/* Internal links out to sibling categories keep crawl depth shallow. */}
        {otherCategories.length > 0 ? (
          <section aria-labelledby="other-categories" className="mt-16 border-t border-line pt-10">
            <h2 id="other-categories" className="text-lg font-bold">
              دسته‌های دیگر
            </h2>
            <ul className="mt-5 flex flex-wrap gap-2">
              {otherCategories.map((item) => (
                <li key={item.id}>
                  <Link
                    href={`/categories/${item.slug}`}
                    className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 text-sm font-medium text-ink-muted transition-colors hover:border-brand hover:text-brand-strong"
                  >
                    {item.name}
                    <span className="nums text-xs opacity-60">{toFaDigits(item.episodeCount)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <SubscribeStrip className="mt-14" />
      </div>
    </>
  );
}
