import type { Metadata } from "next";
import Link from "next/link";

import { JsonLd } from "@/components/seo/json-ld";
import { PageHeader } from "@/components/site/page-header";
import { siteConfig } from "@/config/site";
import { breadcrumbSchema, graph, websiteSchema } from "@/lib/structured-data";
import { getTopics } from "@/server/topics";

export const metadata: Metadata = {
  title: "موضوع‌ها",
  description: `موضوع‌های اصلی پادکست ${siteConfig.name}: تعارض و ارتباط، تمرکز و انرژی، انگیزه و عملکرد، ذهن پالوده و مدیریت منابع.`,
  alternates: { canonical: "/topics" },
  openGraph: { title: `موضوع‌ها | ${siteConfig.name}`, url: "/topics" },
};

export default async function TopicsPage() {
  const topics = await getTopics();

  return (
    <>
      <JsonLd
        data={graph(
          websiteSchema(),
          breadcrumbSchema([
            { name: "خانه", path: "/" },
            { name: "موضوع‌ها", path: "/topics" },
          ]),
        )}
      />

      <PageHeader
        eyebrow="راهنمای آرشیو"
        title="موضوع‌ها"
        lead="هر موضوع یک مسیر است: مجموعه‌ای از اپیزودها که یک مسئله را از زوایای مختلف باز می‌کنند. از هر جا که به کار امروزتان نزدیک‌تر است شروع کنید."
      />

      <div className="container-page py-12 md:py-16">
        {topics.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line-strong bg-surface px-6 py-20 text-center text-ink-muted">
            هنوز موضوعی منتشر نشده است.
          </p>
        ) : (
          <ul className="grid gap-5 md:grid-cols-2">
            {topics.map((topic) => (
              <li key={topic.id} className="flex">
                <Link
                  href={`/topics/${topic.slug}`}
                  className="group flex w-full flex-col rounded-2xl border border-line bg-surface p-7 transition-all duration-300 hover:-translate-y-1 hover:border-brand hover:shadow-card"
                >
                  <div className="flex items-start justify-between gap-4">
                    <h2 className="text-xl font-bold transition-colors group-hover:text-brand-strong">
                      {topic.name}
                    </h2>
                    <span className="nums shrink-0 rounded-full bg-brand-soft px-3 py-1 text-xs font-bold text-brand-strong">
                      {topic.episodeCount} اپیزود
                    </span>
                  </div>
                  {topic.description ? (
                    <p className="mt-3 leading-loose text-ink-muted">{topic.description}</p>
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
