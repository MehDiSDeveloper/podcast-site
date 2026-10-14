import { ArrowLeft, Award } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { JsonLd } from "@/components/seo/json-ld";
import { PageHeader } from "@/components/site/page-header";
import { buttonStyles } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { pageMetadata } from "@/lib/seo";
import { breadcrumbSchema, graph, personSchema } from "@/lib/structured-data";

export const metadata: Metadata = pageMetadata({
  title: "درباره‌ی من",
  description: `${siteConfig.author.name}، ${siteConfig.author.role}.`,
  path: "/about",
  type: "profile",
});

/**
 * Name, role and links only. The longer text about the podcast and its
 * approach was removed on purpose; the owner will write it.
 */
export default function AboutPage() {
  const { credentials } = siteConfig.author;

  return (
    <>
      <JsonLd
        data={graph(
          { ...personSchema(), mainEntityOfPage: `${siteConfig.url}/about` },
          breadcrumbSchema([
            { name: "خانه", path: "/" },
            { name: "درباره‌ی من", path: "/about" },
          ]),
        )}
      />

      <PageHeader eyebrow="درباره‌ی من" title={`سلام، ${siteConfig.author.name} هستم`} lead={siteConfig.author.role}>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link href="/episodes" className={buttonStyles({ size: "lg" })}>
            اپیزودها
            <ArrowLeft className="size-4" aria-hidden="true" />
          </Link>
          <Link href="/collaborate" className={buttonStyles({ variant: "outline", size: "lg" })}>
            همکاری
          </Link>
        </div>
      </PageHeader>

      {credentials.length > 0 ? (
        <div className="container-page py-14 md:py-20">
          <div className="glass spotlight max-w-2xl rounded-2xl p-6">
            <h2 className="text-base font-bold">سوابق و مدارک</h2>
            <ul className="mt-4 flex flex-col gap-3">
              {credentials.map((credential) => (
                <li key={credential} className="flex gap-2.5 text-sm leading-loose text-ink-muted">
                  <Award className="mt-1 size-4 shrink-0 text-accent" aria-hidden="true" />
                  {credential}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </>
  );
}
