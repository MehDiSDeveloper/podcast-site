import { ArrowLeft, Award } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { JsonLd } from "@/components/seo/json-ld";
import { PageHeader } from "@/components/site/page-header";
import { buttonStyles } from "@/components/ui/button";
import { disciplines } from "@/config/services";
import { siteConfig } from "@/config/site";
import { pageMetadata } from "@/lib/seo";
import { breadcrumbSchema, graph, personSchema } from "@/lib/structured-data";

export const metadata: Metadata = pageMetadata({
  title: "درباره‌ی من",
  description: `${siteConfig.author.name}، ${siteConfig.author.role}. درباره‌ی رویکرد، پیشینه و نگاهی که پشت پادکست ${siteConfig.name} است.`,
  path: "/about",
  type: "profile",
});

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
    title: "قابل‌پیگیری، نه فقط الهام‌بخش",
    body: "بینشی که به قدمی مشخص نرسد، زود فراموش می‌شود. هر گفت‌وگو و هر اپیزود باید به مسئله‌ای برسد که بشود دنبالش کرد و دید چه چیزی را تغییر می‌دهد.",
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
        lead={`${siteConfig.author.role}. کمک می‌کنم آدم‌ها مسئله‌ی خودشان را پیدا کنند و موقعیتی را که در آن هستند، به مسئله‌ای روشن و قابل‌پیگیری تبدیل کنند.`}
      />

      <div className="container-page grid gap-14 py-14 md:py-20 lg:grid-cols-[minmax(0,1.4fr)_1fr]">
        <div className="rich-text max-w-2xl text-[1.0625rem]">
          <p>
            پادکست {siteConfig.name} از یک مشاهده‌ی ساده شروع شد: بیشتر وقت‌ها گیر ما نبودِ راه‌حل نیست؛ این
            است که هنوز نمی‌دانیم مسئله دقیقاً چیست. فقط حس می‌کنیم چیزی درست نیست — در کار، در یک رابطه، در
            تصمیمی که هی عقب می‌افتد — و همین ابهام، هر تلاشی را خسته‌کننده می‌کند.
          </p>
          <p>
            برای فهم این موقعیت‌ها دانش کم نیست: قرن‌ها فلسفه، و چند دهه پژوهش در روان‌شناسی و علوم اعصاب. اما
            این دانش معمولاً به لحظه‌ای که لازم است نمی‌رسد؛ لحظه‌ای که باید موقعیتی درهم را آن‌قدر روشن کنیم
            که بدانیم دقیقاً با چه چیزی روبه‌روییم.
          </p>
          <p>
            کار من کمک به همین روشن شدن است: پیدا کردن مسئله‌ی واقعی و صورت‌بندی آن، طوری که به چیزی
            قابل‌پیگیری تبدیل شود. در پادکست این کار را برای هر کسی که گوش بدهد انجام می‌دهم؛ در گفت‌وگوهای
            فردی و کارگاه‌ها، عمیق‌تر و برای موقعیت مشخص خودتان.
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
              در کنار پادکست، تعداد محدودی گفت‌وگوی فردی، گروهی و کارگاه پذیرفته می‌شود.
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
