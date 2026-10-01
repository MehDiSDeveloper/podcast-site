import { Clock, Mail, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";

import { JsonLd } from "@/components/seo/json-ld";
import { PageHeader } from "@/components/site/page-header";
import { siteConfig } from "@/config/site";
import { COLLABORATION_TYPES, type CollaborationType } from "@/lib/enums";
import { breadcrumbSchema, graph, personSchema } from "@/lib/structured-data";

import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "تماس و دعوت به همکاری",
  description: `برای همکاری با ${siteConfig.author.name} در مسئله‌های سازمانی، همراهی فردی، کار با تیم، کارگاه یا سخنرانی.`,
  alternates: { canonical: "/contact" },
  openGraph: { title: `تماس و دعوت به همکاری | ${siteConfig.name}`, url: "/contact" },
};

export default async function ContactPage({ searchParams }: PageProps<"/contact">) {
  const { type } = await searchParams;
  // Service cards deep-link here with ?type=…, so the right option is preselected.
  const defaultType = COLLABORATION_TYPES.includes(type as CollaborationType)
    ? (type as CollaborationType)
    : undefined;

  return (
    <>
      <JsonLd
        data={graph(
          personSchema(),
          breadcrumbSchema([
            { name: "خانه", path: "/" },
            { name: "تماس و دعوت به همکاری", path: "/contact" },
          ]),
        )}
      />

      <PageHeader
        eyebrow="همکاری"
        title="درباره‌ی مسئله‌تان بنویسید"
        lead="لازم نیست دقیق یا کامل باشد؛ همین که روشن شود چه می‌گذرد کافی است. هر پیام با دقت خوانده می‌شود و پاسخ می‌گیرد."
      />

      <div className="container-page grid gap-12 py-12 md:py-16 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0">
          <ContactForm defaultType={defaultType} />
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
          <div className="glass spotlight rounded-2xl p-6">
            <h2 className="text-base font-bold">بعد از ارسال</h2>
            <p className="mt-3 text-sm leading-loose text-ink-muted">
              اگر به نظر برسد همکاری معنا دارد، برای یک گفت‌وگو هماهنگ می‌شود. اگر نه، همین صادقانه گفته
              می‌شود — و اگر ممکن باشد، همراه با معرفی کسی که مناسب‌تر است.
            </p>
          </div>

          <ul className="flex flex-col gap-3 glass rounded-2xl p-6 text-sm">
            <li className="flex items-center gap-3 text-ink-muted">
              <Clock className="size-4.5 shrink-0 text-brand" aria-hidden="true" />
              پاسخ، معمولاً ظرف چند روز کاری
            </li>
            <li className="flex items-center gap-3 text-ink-muted">
              <ShieldCheck className="size-4.5 shrink-0 text-brand" aria-hidden="true" />
              اطلاعات شما محرمانه می‌ماند
            </li>
            <li className="flex items-center gap-3 text-ink-muted">
              <Mail className="size-4.5 shrink-0 text-brand" aria-hidden="true" />
              <a
                href={`mailto:${siteConfig.author.email}`}
                className="font-medium text-ink transition-colors hover:text-brand-strong"
                dir="ltr"
              >
                {siteConfig.author.email}
              </a>
            </li>
          </ul>
        </aside>
      </div>
    </>
  );
}
