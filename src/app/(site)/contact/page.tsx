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
  description: `برای کوچینگ فردی یا تیمی، کارگاه آموزشی، مشاوره‌ی سازمانی یا سخنرانی با ${siteConfig.author.name} در تماس باشید.`,
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
        eyebrow="دعوت به همکاری"
        title="بیایید درباره‌ی تیم شما حرف بزنیم"
        lead="چند خط درباره‌ی مسئله‌ای که با آن روبه‌رو هستید بنویسید. بعد از خواندن، برای یک گفت‌وگوی کوتاه و بدون تعهد تماس می‌گیرم تا ببینیم همکاری منطقی است یا نه."
      />

      <div className="container-page grid gap-12 py-12 md:py-16 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0">
          <ContactForm defaultType={defaultType} />
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-line bg-surface p-6">
            <h2 className="text-base font-bold">بعد از ارسال چه اتفاقی می‌افتد؟</h2>
            <ol className="mt-4 flex flex-col gap-4 text-sm leading-loose text-ink-muted">
              <li className="flex gap-3">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-soft text-xs font-bold text-brand-strong">
                  ۱
                </span>
                درخواست را با دقت می‌خوانم.
              </li>
              <li className="flex gap-3">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-soft text-xs font-bold text-brand-strong">
                  ۲
                </span>
                برای یک گفت‌وگوی ۲۰ دقیقه‌ای رایگان هماهنگ می‌کنیم.
              </li>
              <li className="flex gap-3">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-soft text-xs font-bold text-brand-strong">
                  ۳
                </span>
                اگر همکاری منطقی بود، پیشنهاد مشخص با دامنه و هزینه ارسال می‌کنم.
              </li>
            </ol>
          </div>

          <ul className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-6 text-sm">
            <li className="flex items-center gap-3 text-ink-muted">
              <Clock className="size-4.5 shrink-0 text-brand" aria-hidden="true" />
              پاسخ ظرف دو روز کاری
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
