import { ArrowLeft, Award } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { JsonLd } from "@/components/seo/json-ld";
import { PageHeader } from "@/components/site/page-header";
import { buttonStyles } from "@/components/ui/button";
import { disciplines } from "@/config/services";
import { siteConfig } from "@/config/site";
import { breadcrumbSchema, graph, personSchema } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: "درباره‌ی من",
  description: `${siteConfig.author.name}، ${siteConfig.author.role}. درباره‌ی رویکرد، پیشینه و نگاهی که پشت پادکست ${siteConfig.name} است.`,
  alternates: { canonical: "/about" },
  openGraph: { title: `درباره‌ی من | ${siteConfig.name}`, url: "/about", type: "profile" },
};

const principles = [
  {
    title: "اول مسئله، بعد راه‌حل",
    body: "بیشتر راه‌حل‌هایی که شکست می‌خورند، مسئله‌ی اشتباهی را حل کرده‌اند. وقت گذاشتن برای فهم درست، ارزان‌ترین بخش کار است.",
  },
  {
    title: "شواهد، نه شعار",
    body: "هر ادعایی که مطرح می‌کنم باید پشتوانه داشته باشد — از پژوهش‌های روان‌شناسی و علوم اعصاب تا تجربه‌ی تاریخی. وقتی شواهد قطعی نیست، همین را صریح می‌گویم.",
  },
  {
    title: "قابل‌اجرا، همین هفته",
    body: "بینشی که به رفتار تبدیل نشود، سرگرمی است. هر گفت‌وگو و هر اپیزود باید با کاری مشخص تمام شود که بشود فردا انجامش داد.",
  },
];

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

      <PageHeader
        eyebrow="درباره‌ی من"
        title={`سلام، ${siteConfig.author.name} هستم`}
        lead={`${siteConfig.author.role}. کارم کمک به آدم‌ها و تیم‌هاست تا مسئله‌هایشان را از زاویه‌ای تازه ببینند و راهی پیدا کنند که در عمل جواب بدهد.`}
      />

      <div className="container-page grid gap-14 py-14 md:py-20 lg:grid-cols-[minmax(0,1.4fr)_1fr]">
        <div className="rich-text max-w-2xl text-[1.0625rem]">
          <p>
            پادکست {siteConfig.name} از یک مشاهده‌ی ساده شروع شد: بیشتر مسئله‌هایی که آدم‌ها در محیط کار با
            آن‌ها درگیرند — تعارض با همکار، انگیزه‌ای که ته کشیده، تصمیمی که هی عقب می‌افتد — مسئله‌های تازه‌ای
            نیستند. قرن‌هاست که فیلسوفان، و چند دهه است که روان‌شناسان و عصب‌پژوهان، درباره‌شان فکر و پژوهش
            کرده‌اند.
          </p>
          <p>
            اما این دانش معمولاً به جایی که لازم است نمی‌رسد: به جلسه‌ی پرتنش صبح شنبه، به گفت‌وگوی سختی که
            مدیر دارد از آن فرار می‌کند، یا به تیمی که همه در آن خسته‌اند و کسی نمی‌داند چرا.
          </p>
          <p>
            کار من پر کردن همین فاصله است. در پادکست، این کار را برای هر کسی که گوش بدهد انجام می‌دهم. در
            کوچینگ، کارگاه و مشاوره، همین کار را عمیق‌تر و مشخص‌تر برای یک فرد، یک تیم یا یک سازمان.
          </p>
        </div>

        <aside className="flex flex-col gap-5 lg:sticky lg:top-24 lg:self-start">
          <div className="glass spotlight rounded-2xl p-6">
            <h2 className="text-base font-bold">زمینه‌هایی که از آن‌ها وام می‌گیرم</h2>
            <ul className="mt-4 flex flex-wrap gap-2">
              {disciplines.map((discipline) => (
                <li
                  key={discipline}
                  className="chip-tint rounded-full px-3.5 py-1.5 text-sm font-medium"
                >
                  {discipline}
                </li>
              ))}
            </ul>
          </div>

          {credentials.length > 0 ? (
            <div className="glass spotlight rounded-2xl p-6">
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
          ) : null}

          <div className="glass spotlight rounded-2xl p-6">
            <h2 className="text-base font-bold">همکاری</h2>
            <p className="mt-2.5 text-sm leading-loose text-ink-muted">
              در کنار پادکست، تعداد محدودی همکاری با مدیران و سازمان‌ها پذیرفته می‌شود.
            </p>
            <Link href="/collaborate" className={buttonStyles({ variant: "outline", className: "mt-5 w-full" })}>
              درباره‌ی همکاری
            </Link>
          </div>
        </aside>
      </div>

      <section aria-labelledby="approach-heading" className="border-t border-line">
        <div className="container-page py-14 md:py-20">
          <h2 id="approach-heading" className="text-2xl md:text-3xl">
            رویکردم
          </h2>
          <ul className="mt-8 grid gap-5 md:grid-cols-3">
            {principles.map((principle) => (
              <li key={principle.title} className="reveal glass spotlight rounded-2xl p-7">
                <h3 className="text-lg font-bold">{principle.title}</h3>
                <p className="mt-3 leading-loose text-ink-muted">{principle.body}</p>
              </li>
            ))}
          </ul>

          <div className="mt-12 flex flex-col items-center gap-4 text-center">
            <p className="text-lg font-bold">بهترین راه شناختن رویکردم، شنیدن یک اپیزود است.</p>
            <Link href="/episodes" className={buttonStyles({ variant: "outline", size: "lg" })}>
              شنیدن اپیزودها
              <ArrowLeft className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
