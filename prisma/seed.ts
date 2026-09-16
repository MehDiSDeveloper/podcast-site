/**
 * Seeds the database with the admin account, the default show, and a handful of
 * demo episodes so a fresh clone has something to look at.
 *
 * Safe to re-run: everything is upserted by slug.
 */
import "../src/lib/load-env";

import { bootstrap } from "../src/server/bootstrap";
import { db } from "../src/server/db";

const topics = [
  {
    slug: "conflict",
    name: "تعارض و ارتباط",
    description: "چطور اختلاف‌ها را به گفت‌وگوی سازنده تبدیل کنیم؟",
    body: "تعارض در تیم اجتناب‌ناپذیر است؛ چیزی که تیم‌های خوب را از بقیه جدا می‌کند، مهارتِ عبور از تعارض است نه نبودِ آن. در این مجموعه اپیزودها سراغ ریشه‌های روان‌شناختی تعارض، الگوهای تکرارشونده‌ی گفت‌وگو و ابزارهای عملی مذاکره می‌رویم.",
    sortOrder: 1,
  },
  {
    slug: "focus-and-energy",
    name: "تمرکز و انرژی",
    description: "مدیریت هوشمندانه‌ی توجه، زمان و توان ذهنی.",
    body: "توجه کمیاب‌ترین منبع سازمان است. اینجا از نوروساینسِ تمرکز، هزینه‌ی جابه‌جایی بین کارها و طراحی روزی که با مغز انسان سر جنگ ندارد حرف می‌زنیم.",
    sortOrder: 2,
  },
  {
    slug: "motivation",
    name: "انگیزه و عملکرد",
    description: "چه چیزی آدم‌ها را واقعاً به حرکت درمی‌آورد؟",
    body: "انگیزه نه با شعار ساخته می‌شود و نه با پاداش صرف. سراغ شواهد تجربی درباره‌ی خودمختاری، شایستگی و معنا می‌رویم و می‌بینیم مدیر چطور می‌تواند محیطی بسازد که انگیزه در آن رشد کند.",
    sortOrder: 3,
  },
  {
    slug: "clear-thinking",
    name: "ذهن پالوده",
    description: "کاهش نویز ذهنی و تصمیم‌گیری روشن‌تر.",
    body: "ذهن شلوغ، تصمیم‌های بد می‌گیرد. از سوگیری‌های شناختی، بارِ ذهنی و تمرین‌هایی می‌گوییم که دیدِ آدم را نسبت به مسئله تمیز می‌کنند.",
    sortOrder: 4,
  },
  {
    slug: "resources",
    name: "مدیریت منابع",
    description: "تصمیم‌گیری درباره‌ی پول، زمان و آدم‌ها.",
    body: "هر تصمیم مدیریتی یک تخصیص منابع است. با نگاهی از اقتصاد رفتاری سراغ هزینه‌ی فرصت، ریسک و انتخاب‌های سختِ روزمره می‌رویم.",
    sortOrder: 5,
  },
];

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
    topics: ["conflict", "clear-thinking"],
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
    topics: ["focus-and-energy", "resources"],
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
    topics: ["motivation", "clear-thinking"],
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
    topics: ["resources", "clear-thinking"],
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
    topics: ["clear-thinking", "focus-and-energy"],
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
    topics: ["conflict", "motivation"],
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

  for (const topic of topics) {
    await db.topic.upsert({
      where: { slug: topic.slug },
      update: {
        name: topic.name,
        description: topic.description,
        body: topic.body,
        sortOrder: topic.sortOrder,
      },
      create: topic,
    });
  }

  for (const episode of episodes) {
    const { topics: topicSlugs, daysAgo, ...rest } = episode;
    const publishedAt = new Date(Date.now() - daysAgo * 86400000);

    const record = await db.episode.upsert({
      where: { slug: episode.slug },
      update: { ...rest, publishedAt, status: "PUBLISHED" },
      create: {
        ...rest,
        showId: show.id,
        publishedAt,
        status: "PUBLISHED",
        audioUrl: DEMO_AUDIO,
        audioSizeBytes: 764176,
        audioMimeType: "audio/mpeg",
      },
    });

    await db.episodeTopic.deleteMany({ where: { episodeId: record.id } });
    const linked = await db.topic.findMany({
      where: { slug: { in: topicSlugs } },
      select: { id: true },
    });
    await db.episodeTopic.createMany({
      data: linked.map((topic) => ({ episodeId: record.id, topicId: topic.id })),
    });
  }

  console.info(`[seed] ${topics.length} topics and ${episodes.length} episodes ready.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
