/**
 * Seeds the database with the admin account, the default show, the categories
 * and lenses, and a handful of demo episodes so a fresh clone has something to
 * look at.
 *
 * Safe to re-run: everything is upserted by slug.
 */
import "../src/lib/load-env";

import { normalizeFa, slugify } from "../src/lib/utils";
import { bootstrap } from "../src/server/bootstrap";
import { db } from "../src/server/db";

const categories = [
  { slug: "self", name: "مواجهه با خود" },
  { slug: "others", name: "مواجهه با دیگران" },
  { slug: "work", name: "مواجهه با کار" },
  { slug: "money", name: "مواجهه با پول" },
  { slug: "power", name: "مواجهه با قدرت" },
  { slug: "change", name: "مواجهه با تغییر" },
  { slug: "meaning", name: "مواجهه با معنا" },
].map((category, index) => ({ ...category, sortOrder: index + 1 }));

const lenses = [
  { slug: "psychology", name: "روان‌شناسی" },
  { slug: "neuroscience", name: "علوم اعصاب" },
  { slug: "history", name: "تاریخ" },
  { slug: "economics", name: "اقتصاد" },
  { slug: "philosophy", name: "فلسفه" },
  { slug: "sociology", name: "جامعه‌شناسی" },
].map((lens, index) => ({ ...lens, sortOrder: index + 1 }));

const episodes = [
  {
    slug: "why-team-conflicts-repeat",
    title: "چرا تعارض‌های تیمی تکرار می‌شوند؟",
    subtitle: "و چطور چرخه را بشکنیم",
    description:
      "بیشتر تعارض‌های تیمی درباره‌ی موضوعی که سرش دعوا می‌شود نیستند. در این اپیزود سراغ لایه‌ی زیرین تعارض می‌رویم و یک چارچوب چهارمرحله‌ای برای گفت‌وگوی سخت مرور می‌کنیم.",
    showNotes: `<p>وقتی یک تعارض برای سومین بار در تیمی تکرار می‌شود، مسئله دیگر خودِ موضوع نیست؛ الگوست. در این اپیزود از سه چیز حرف می‌زنیم:</p>
<ul>
  <li>تفاوت میان <strong>موضع</strong> و <strong>نیاز</strong> و اینکه چرا مذاکره روی موضع همیشه به بن‌بست می‌رسد.</li>
  <li>نقش تهدید ادراک‌شده در مغز و اینکه چرا آدم در جلسه‌ی پرتنش عملاً باهوش‌تر نمی‌شود.</li>
  <li>یک چارچوب چهارمرحله‌ای برای شروع گفت‌وگوی سخت، بدون اینکه رابطه هزینه بدهد.</li>
</ul>
<h2>آنچه در این اپیزود می‌شنوید</h2>
<ol>
  <li>چرا «بیایید حرفه‌ای باشیم» معمولاً نتیجه‌ی عکس می‌دهد.</li>
  <li>سه الگوی تکرارشونده‌ی تعارض در تیم‌ها.</li>
  <li>تمرین عملی برای جلسه‌ی بعدی‌تان.</li>
</ol>`,
    episodeNumber: 1,
    durationSeconds: 2460,
    featured: true,
    category: "others",
    lenses: ["psychology", "neuroscience"],
    tags: ["تعارض", "گفت\u200cوگوی سخت"],
    daysAgo: 7,
  },
  {
    slug: "attention-is-the-scarcest-resource",
    title: "توجه، کمیاب‌ترین منبع سازمان",
    subtitle: "اقتصادِ تمرکز در محیط کار",
    description:
      "هر بار که حواس‌تان پرت می‌شود، چیزی بیشتر از چند دقیقه از دست می‌رود. نگاهی به هزینه‌ی واقعی جابه‌جایی بین کارها و راه‌هایی برای محافظت از توجه تیم.",
    showNotes: `<p>مدیرها معمولاً زمان را مدیریت می‌کنند، اما آنچه واقعاً کمیاب است توجه است. در این اپیزود:</p>
<ul>
  <li>هزینه‌ی شناختی جابه‌جایی بین کارها و اینکه چرا حس می‌کنیم پرکاریم ولی خروجی کم است.</li>
  <li>تفاوت کار عمیق و کار واکنشی.</li>
  <li>چهار تغییر ساختاری که یک تیم می‌تواند همین هفته اجرا کند.</li>
</ul>`,
    episodeNumber: 2,
    durationSeconds: 1980,
    category: "work",
    lenses: ["neuroscience", "economics"],
    tags: ["تمرکز", "بهره\u200cوری"],
    daysAgo: 14,
  },
  {
    slug: "motivation-is-not-a-speech",
    title: "انگیزه با سخنرانی ساخته نمی‌شود",
    subtitle: "آنچه شواهد درباره‌ی انگیزه می‌گویند",
    description:
      "پاداش بیشتر همیشه یعنی تلاش بیشتر؟ سراغ شواهد تجربی می‌رویم و می‌بینیم چه چیزی واقعاً انگیزه‌ی پایدار می‌سازد و چه چیزی آن را از بین می‌برد.",
    showNotes: `<p>این اپیزود درباره‌ی سه نیاز روان‌شناختی است که بدون‌شان هیچ سیستم پاداشی کار نمی‌کند: خودمختاری، شایستگی و تعلق.</p>
<blockquote>آدم‌ها برای پول کار می‌کنند، اما برای معنا می‌مانند.</blockquote>
<p>در ادامه سراغ اشتباه رایج مدیران می‌رویم: تلاش برای «انگیزه دادن» به جای «برداشتن موانع انگیزه».</p>`,
    episodeNumber: 3,
    durationSeconds: 2760,
    category: "work",
    lenses: ["psychology"],
    tags: ["انگیزه"],
    daysAgo: 21,
  },
  {
    slug: "the-cost-of-every-yes",
    title: "هزینه‌ی پنهان هر «بله»",
    subtitle: "هزینه‌ی فرصت در تصمیم‌های روزمره",
    description:
      "هر بار که به کاری بله می‌گویید، به چیز دیگری نه گفته‌اید. نگاهی از اقتصاد رفتاری به تصمیم‌هایی که ظاهراً کوچک‌اند و در عمل مسیر تیم را عوض می‌کنند.",
    showNotes: `<p>هزینه‌ی فرصت مفهومی است که همه در اقتصاد خوانده‌ایم و تقریباً هیچ‌کس در تصمیم‌های روزمره به کار نمی‌برد.</p>
<ul>
  <li>چرا «فقط یک جلسه‌ی دیگر» گران‌تر از چیزی است که فکر می‌کنید.</li>
  <li>سوگیری هزینه‌ی ازدست‌رفته و پروژه‌هایی که هیچ‌وقت تعطیل نمی‌شوند.</li>
  <li>یک سؤال ساده که پیش از هر «بله» بپرسید.</li>
</ul>`,
    episodeNumber: 4,
    durationSeconds: 1740,
    category: "money",
    lenses: ["economics"],
    tags: ["تصمیم\u200cگیری", "هزینه\u200cی فرصت"],
    daysAgo: 28,
  },
  {
    slug: "a-quieter-mind-at-work",
    title: "ذهن آرام‌تر در محیط شلوغ",
    subtitle: "کاهش بار ذهنی بدون ترک شغل",
    description:
      "شلوغی ذهن را نمی‌شود با تلاش بیشتر حل کرد. درباره‌ی بار شناختی، مرزگذاری و تمرین‌هایی که در عمل جواب می‌دهند.",
    showNotes: `<p>در این اپیزود از تفاوت میان فشار و بارِ ذهنی حرف می‌زنیم و اینکه چرا آدم‌های توانمند زودتر می‌سوزند.</p>`,
    episodeNumber: 5,
    durationSeconds: 2100,
    category: "self",
    lenses: ["psychology", "neuroscience"],
    tags: ["فرسودگی", "تمرکز"],
    daysAgo: 35,
  },
  {
    slug: "feedback-that-lands",
    title: "بازخوردی که به مقصد می‌رسد",
    subtitle: "چرا بیشتر بازخوردها هدر می‌روند",
    description:
      "بازخورد خوب فقط صادق نیست، قابل شنیدن هم هست. ساختاری برای گفتن حرف سخت، طوری که طرف مقابل بتواند از آن استفاده کند.",
    showNotes: `<p>بازخورد زمانی کار می‌کند که شنونده در حالت دفاعی نباشد. سراغ سه خطای رایج و یک ساختار جایگزین می‌رویم.</p>`,
    episodeNumber: 6,
    durationSeconds: 2280,
    category: "others",
    lenses: ["psychology"],
    tags: ["بازخورد", "گفت\u200cوگوی سخت"],
    daysAgo: 42,
  },
];

/**
 * A short public-domain audio file so the player is usable in a fresh install.
 * Replace with your own hosted files from the admin panel.
 */
const DEMO_AUDIO = "https://archive.org/download/testmp3testfile/mpthreetest.mp3";

async function main() {
  await bootstrap();

  const show = await db.show.findFirst({ where: { isDefault: true } });
  if (!show) throw new Error("Default show missing — bootstrap did not run.");

  for (const category of categories) {
    await db.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name, sortOrder: category.sortOrder },
      create: category,
    });
  }

  for (const lens of lenses) {
    await db.lens.upsert({
      where: { slug: lens.slug },
      update: { name: lens.name, sortOrder: lens.sortOrder },
      create: lens,
    });
  }

  for (const episode of episodes) {
    const { category: categorySlug, lenses: lensSlugs, tags: tagNames, daysAgo, ...rest } = episode;
    const publishedAt = new Date(Date.now() - daysAgo * 86400000);
    const category = await db.category.findUniqueOrThrow({ where: { slug: categorySlug }, select: { id: true } });

    const record = await db.episode.upsert({
      where: { slug: episode.slug },
      update: { ...rest, publishedAt, status: "PUBLISHED", categoryId: category.id },
      create: {
        ...rest,
        showId: show.id,
        categoryId: category.id,
        publishedAt,
        status: "PUBLISHED",
        audioUrl: DEMO_AUDIO,
        audioSizeBytes: 764176,
        audioMimeType: "audio/mpeg",
      },
    });

    await db.episodeLens.deleteMany({ where: { episodeId: record.id } });
    const linked = await db.lens.findMany({ where: { slug: { in: lensSlugs } }, select: { id: true } });
    await db.episodeLens.createMany({ data: linked.map((lens) => ({ episodeId: record.id, lensId: lens.id })) });

    await db.episodeTag.deleteMany({ where: { episodeId: record.id } });
    for (const tagName of tagNames) {
      const name = normalizeFa(tagName);
      const tag = await db.tag.upsert({ where: { name }, update: {}, create: { name, slug: slugify(name) } });
      await db.episodeTag.create({ data: { episodeId: record.id, tagId: tag.id } });
    }
  }

  console.info(
    `[seed] ${categories.length} categories, ${lenses.length} lenses and ${episodes.length} episodes ready.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
