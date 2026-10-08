import type { Metadata } from "next";
import Link from "next/link";

import { JsonLd } from "@/components/seo/json-ld";
import { PageHeader } from "@/components/site/page-header";
import { services } from "@/config/services";
import { siteConfig } from "@/config/site";
import { COLLABORATION_TYPES, type CollaborationType } from "@/lib/enums";
import { pageMetadata } from "@/lib/seo";
import { breadcrumbSchema, graph, personSchema, professionalServiceSchema } from "@/lib/structured-data";

import { ContactForm } from "../contact/contact-form";

export const metadata: Metadata = pageMetadata({
  title: "همکاری",
  description: `شیوه‌های همکاری با ${siteConfig.author.name}: مسئله‌های سازمانی، همراهی فردی، کار با تیم، کارگاه و سخنرانی.`,
  path: "/collaborate",
});

/**
 * Two things only: the ways of working, then the invitation form. Each card
 * links to the form with its type preselected (?type=…#invite).
 */
export default async function CollaboratePage({ searchParams }: PageProps<"/collaborate">) {
  const { type } = await searchParams;
  const defaultType = COLLABORATION_TYPES.includes(type as CollaborationType)
    ? (type as CollaborationType)
    : undefined;

  return (
    <>
      <JsonLd
        data={graph(
          personSchema(),
          professionalServiceSchema(services.map((s) => ({ name: s.title, description: s.summary }))),
          breadcrumbSchema([
            { name: "خانه", path: "/" },
            { name: "همکاری", path: "/collaborate" },
          ]),
        )}
      />

      <PageHeader
        eyebrow="همکاری"
        title="شیوه‌های همکاری"
        lead="در کنار پادکست، تعداد محدودی همکاری با مدیران و سازمان‌ها پذیرفته می‌شود."
      />

      <section aria-labelledby="ways-heading" className="border-b border-line">
        <div className="container-page py-14 md:py-20">
          <h2 id="ways-heading" className="sr-only">
            شیوه‌های همکاری
          </h2>

          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <li key={service.type} className="reveal flex">
                <Link
                  href={`/collaborate?type=${service.type}#invite`}
                  className="group flex w-full flex-col glass spotlight rounded-2xl p-7 transition-transform duration-300 hover:-translate-y-1"
                >
                  <h3 className="text-xl font-bold transition-colors group-hover:text-brand-strong">
                    {service.title}
                  </h3>
                  <p className="mt-3 flex-1 leading-loose text-ink-muted">{service.summary}</p>
                  <p className="mt-6 border-t border-line pt-4 text-sm text-ink-subtle">{service.note}</p>
                </Link>
              </li>
            ))}
          </ul>

          <p className="mt-8 max-w-2xl text-sm leading-loose text-ink-subtle">
            بسته به مسئله، ممکن است بخشی از کار با هماهنگی شما به همکاران نزدیکم سپرده شود؛ گفت‌وگو و
            مسئولیت کار همیشه با خودم می‌ماند.
          </p>
        </div>
      </section>

      <section id="invite" aria-labelledby="invite-heading" className="scroll-mt-24">
        <div className="container-page py-14 md:py-20">
          <div className="mx-auto max-w-3xl">
            <h2 id="invite-heading" className="text-2xl md:text-3xl">
              دعوت به همکاری
            </h2>
            <p className="mt-3 leading-loose text-ink-muted">
              چند خط درباره‌ی مسئله بنویسید. هر پیام با دقت خوانده می‌شود و پاسخ می‌گیرد.
            </p>
            <div className="mt-10">
              {/* Keyed so a card click remounts the form with the new preselection. */}
              <ContactForm key={defaultType ?? "none"} defaultType={defaultType} />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
