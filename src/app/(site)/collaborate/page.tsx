import { ArrowLeft, Check, ChevronDown } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { JsonLd } from "@/components/seo/json-ld";
import { PageHeader } from "@/components/site/page-header";
import { buttonStyles } from "@/components/ui/button";
import { collaborationFaq, engagementSteps, services } from "@/config/services";
import { siteConfig } from "@/config/site";
import {
  breadcrumbSchema,
  faqSchema,
  graph,
  personSchema,
  professionalServiceSchema,
} from "@/lib/structured-data";
import { toFaDigits } from "@/lib/utils";

export const metadata: Metadata = {
  title: "همکاری با سازمان‌ها",
  description: `کوچینگ فردی و تیمی، کارگاه آموزشی، مشاوره‌ی سازمانی و سخنرانی با ${siteConfig.author.name} — مبتنی بر روان‌شناسی، علوم اعصاب و اقتصاد رفتاری.`,
  alternates: { canonical: "/collaborate" },
  openGraph: { title: `همکاری با سازمان‌ها | ${siteConfig.name}`, url: "/collaborate" },
};

export default function CollaboratePage() {
  return (
    <>
      <JsonLd
        data={graph(
          personSchema(),
          professionalServiceSchema(services.map((s) => ({ name: s.title, description: s.summary }))),
          faqSchema(collaborationFaq),
          breadcrumbSchema([
            { name: "خانه", path: "/" },
            { name: "همکاری با سازمان‌ها", path: "/collaborate" },
          ]),
        )}
      />

      <PageHeader
        eyebrow="برای سازمان‌ها و مدیران"
        title="از مسئله‌ی واقعی شروع می‌کنیم، نه از یک بسته‌ی آماده"
        lead="هر تیم مسئله‌ی خودش را دارد. کار من این است که ریشه را از نشانه‌ها جدا کنم و مسیری بسازم که در عمل اجرا شود — با پشتوانه‌ی شواهد، نه شعار."
      >
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/contact" className={buttonStyles({ size: "lg" })}>
            شروع گفت‌وگو
            <ArrowLeft className="size-4" aria-hidden="true" />
          </Link>
          <a href="#services" className={buttonStyles({ variant: "outline", size: "lg" })}>
            مرور خدمات
          </a>
        </div>
      </PageHeader>

      {/* ------------------------------------------------------------ services */}
      <section id="services" aria-labelledby="services-heading" className="border-b border-line">
        <div className="container-page py-16 md:py-20">
          <h2 id="services-heading" className="text-2xl md:text-3xl">
            شکل‌های همکاری
          </h2>
          <p className="mt-3 max-w-2xl leading-loose text-ink-muted">
            هر کدام را می‌شود مستقل یا ترکیبی اجرا کرد. اگر مطمئن نیستید کدام مناسب است، همین را در پیام
            بنویسید.
          </p>

          <ul className="mt-10 grid gap-5 lg:grid-cols-2">
            {services.map((service) => (
              <li key={service.type} className="flex">
                <article className="flex w-full flex-col rounded-2xl border border-line bg-surface p-7 transition-shadow duration-300 hover:shadow-card">
                  <h3 className="text-xl font-bold">{service.title}</h3>
                  <p className="mt-2.5 leading-loose text-ink-muted">{service.summary}</p>

                  <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
                    <div className="rounded-xl bg-canvas px-4 py-3">
                      <dt className="text-xs font-semibold text-ink-subtle">مناسب برای</dt>
                      <dd className="mt-1 font-medium">{service.audience}</dd>
                    </div>
                    <div className="rounded-xl bg-canvas px-4 py-3">
                      <dt className="text-xs font-semibold text-ink-subtle">قالب</dt>
                      <dd className="mt-1 font-medium">{service.format}</dd>
                    </div>
                  </dl>

                  <p className="mt-6 text-sm font-bold">آنچه به دست می‌آید</p>
                  <ul className="mt-3 flex flex-1 flex-col gap-2.5">
                    {service.outcomes.map((outcome) => (
                      <li key={outcome} className="flex gap-2.5 text-sm leading-loose text-ink-muted">
                        <Check className="mt-1.5 size-4 shrink-0 text-success" aria-hidden="true" />
                        {outcome}
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={`/contact?type=${service.type}`}
                    className="mt-7 inline-flex items-center gap-1.5 self-start text-sm font-bold text-brand-strong transition-colors hover:text-brand"
                  >
                    درخواست {service.title}
                    <ArrowLeft className="size-4" aria-hidden="true" />
                  </Link>
                </article>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ------------------------------------------------------------- process */}
      <section aria-labelledby="process-heading" className="border-b border-line bg-surface">
        <div className="container-page py-16 md:py-20">
          <h2 id="process-heading" className="text-2xl md:text-3xl">
            همکاری چطور پیش می‌رود؟
          </h2>

          <ol className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {engagementSteps.map((step, index) => (
              <li key={step.title} className="relative rounded-2xl border border-line bg-canvas p-6">
                <span className="grid size-10 place-items-center rounded-full bg-brand text-base font-bold text-brand-contrast">
                  {toFaDigits(index + 1)}
                </span>
                <h3 className="mt-5 text-lg font-bold">{step.title}</h3>
                <p className="mt-2.5 text-sm leading-loose text-ink-muted">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ----------------------------------------------------------------- faq */}
      <section aria-labelledby="faq-heading" className="border-b border-line">
        <div className="container-page grid gap-10 py-16 md:py-20 lg:grid-cols-[1fr_1.6fr]">
          <div>
            <h2 id="faq-heading" className="text-2xl md:text-3xl">
              پرسش‌های پرتکرار
            </h2>
            <p className="mt-3 leading-loose text-ink-muted">
              پاسخ سؤال‌تان اینجا نیست؟{" "}
              <Link href="/contact" className="font-semibold text-brand-strong underline underline-offset-4">
                مستقیم بپرسید
              </Link>
              .
            </p>
          </div>

          {/* Native <details>: accessible and works with JavaScript disabled. */}
          <div className="flex flex-col gap-3">
            {collaborationFaq.map((item) => (
              <details
                key={item.question}
                className="group rounded-2xl border border-line bg-surface open:shadow-card"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 font-bold [&::-webkit-details-marker]:hidden">
                  {item.question}
                  <ChevronDown
                    className="size-5 shrink-0 text-ink-subtle transition-transform duration-300 group-open:rotate-180"
                    aria-hidden="true"
                  />
                </summary>
                <p className="px-5 pb-5 leading-loose text-ink-muted">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------- cta */}
      <section className="bg-surface">
        <div className="container-page py-16 md:py-20">
          <div className="relative overflow-hidden rounded-3xl bg-brand px-8 py-14 text-center text-brand-contrast md:px-16">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(40rem_20rem_at_50%_-20%,oklch(1_0_0/0.18),transparent_70%)]"
            />
            <h2 className="relative text-3xl md:text-4xl">اولین قدم، یک گفت‌وگوی کوتاه است</h2>
            <p className="relative mx-auto mt-4 max-w-xl leading-loose opacity-85">
              بدون تعهد و بدون هزینه. فقط مسئله را بگویید تا ببینیم می‌توانم کمکی کنم یا نه.
            </p>
            <Link
              href="/contact"
              className="relative mt-8 inline-flex h-13 items-center gap-2 rounded-lg bg-surface px-7 font-bold text-brand-strong shadow-lifted transition-transform hover:scale-[1.02]"
            >
              ارسال درخواست همکاری
              <ArrowLeft className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
