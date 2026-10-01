import type { Metadata } from "next";
import Link from "next/link";

import { JsonLd } from "@/components/seo/json-ld";
import { PageHeader } from "@/components/site/page-header";
import { siteConfig } from "@/config/site";
import { breadcrumbSchema, graph, websiteSchema } from "@/lib/structured-data";
import { toFaDigits } from "@/lib/utils";
import { getCategories } from "@/server/taxonomy";

export const metadata: Metadata = {
  title: "دسته‌ها",
  description: `دسته‌های اصلی پادکست ${siteConfig.name}؛ هر دسته یک مواجهه، با اپیزودهایی که آن را از زوایای مختلف باز می‌کنند.`,
  alternates: { canonical: "/categories" },
  openGraph: { title: `دسته‌ها | ${siteConfig.name}`, url: "/categories" },
};

/** Per request, not at build time — see the note in src/app/(site)/page.tsx. */
export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <>
      <JsonLd
        data={graph(
          websiteSchema(),
          breadcrumbSchema([
            { name: "خانه", path: "/" },
            { name: "دسته‌ها", path: "/categories" },
          ]),
        )}
      />

      <PageHeader
        eyebrow="راهنمای آرشیو"
        title="دسته‌ها"
        lead="هر دسته یک مسیر است: مجموعه‌ای از اپیزودها که یک مسئله را از زوایای مختلف باز می‌کنند. از هر جا که به کار امروزتان نزدیک‌تر است شروع کنید."
      />

      <div className="container-page py-12 md:py-16">
        {categories.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line-strong bg-surface px-6 backdrop-blur-xl py-20 text-center text-ink-muted">
            هنوز دسته‌ای منتشر نشده است.
          </p>
        ) : (
          <ul className="grid gap-5 md:grid-cols-2">
            {categories.map((category) => (
              <li key={category.id} className="reveal flex">
                <Link
                  href={`/categories/${category.slug}`}
                  className="group flex w-full flex-col glass spotlight rounded-2xl p-7 transition-all duration-300 hover:-translate-y-1"
                  style={category.accentColor ? { borderTopColor: category.accentColor, borderTopWidth: 3 } : undefined}
                >
                  <div className="flex items-start justify-between gap-4">
                    <h2 className="text-xl font-bold transition-colors group-hover:text-brand-strong">
                      {category.name}
                    </h2>
                    <span className="nums chip-tint shrink-0 rounded-full px-3 py-1 text-xs font-bold">
                      {toFaDigits(category.episodeCount)} اپیزود
                    </span>
                  </div>
                  {category.description ? (
                    <p className="mt-3 leading-loose text-ink-muted">{category.description}</p>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
