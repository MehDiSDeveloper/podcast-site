/**
 * Demo content for the promo copy of the site (promo/up.sh), never for
 * production. The copy starts from the newest production backup, so the show,
 * its description and its covers are the real ones; production has no episodes
 * yet, so this adds categories, lenses, ten demo episodes (one scheduled, one
 * draft) with silent audio, and a few inquiries, so every page has something
 * to show. It also removes the backup's sessions and sign-in attempts and
 * writes a fresh admin session token to data/admin-session.txt, so the capture
 * script enters the panel without a password.
 *
 *   docker compose -f promo/docker-compose.yml exec -T web npx tsx promo/seed.ts
 */
import { createHash, randomBytes } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { normalizeFa, slugify } from "../src/lib/utils";
import { db } from "../src/server/db";

const DATA_DIR = "/app/data";
const UPLOAD_DIR = process.env.UPLOAD_DIR || join(DATA_DIR, "uploads");
const DAY = 86400000;

// The categories and lenses of prisma/seed.ts.
const categories = [
  { slug: "self", name: "مواجهه با خود" },
  { slug: "others", name: "مواجهه با دیگران" },
  { slug: "work", name: "مواجهه با کار" },
  { slug: "money", name: "مواجهه با پول" },
  { slug: "power", name: "مواجهه با قدرت" },
  { slug: "change", name: "مواجهه با تغییر" },
  { slug: "meaning", name: "مواجهه با معنا" },
];

const lenses = [
  { slug: "psychology", name: "روان‌شناسی" },
  { slug: "neuroscience", name: "علوم اعصاب" },
  { slug: "history", name: "تاریخ" },
  { slug: "economics", name: "اقتصاد" },
  { slug: "philosophy", name: "فلسفه" },
  { slug: "sociology", name: "جامعه‌شناسی" },
];

type DemoEpisode = {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  showNotes: string;
  minutes: number;
  category: string;
  lenses: string[];
  tags: string[];
  /** Negative = in the future (scheduled). */
  daysAgo: number;
  plays: number;
  status?: "PUBLISHED" | "SCHEDULED" | "DRAFT";
  featured?: boolean;
};

const episodes: DemoEpisode[] = [
  {
    slug: "something-is-not-right",
    title: "«یک چیزی درست نیست»",
    subtitle: "از یک حس مبهم تا یک مسئله‌ی روشن",
    description:
      "همه‌مان آن حس را می‌شناسیم: چیزی سر جایش نیست، ولی نمی‌دانیم چه. در این اپیزود قدم‌به‌قدم می‌بینیم چطور یک حس گنگ را به جمله‌ای تبدیل کنیم که بشود رویش کار کرد.",
    showNotes: `<p>«یک چیزی درست نیست» شروع خوبی است، اما جای ماندن نیست. در این اپیزود سه قدم را مرور می‌کنیم:</p>
<ul>
  <li><strong>دیدن:</strong> نشانه‌ها را بدون قضاوت یادداشت کنیم؛ کجا، کی و با چه کسی؟</li>
  <li><strong>نام‌گذاری:</strong> برای آنچه دیده‌ایم یک اسم ساده پیدا کنیم.</li>
  <li><strong>قاب‌بندی:</strong> آن را در یک جمله بنویسیم که با «چطور می‌توانم…» شروع شود.</li>
</ul>
<h2>تمرین این هفته</h2>
<p>سه بار در هفته، هر بار پنج دقیقه، بنویسید امروز کجا «یک چیزی درست نبود».</p>`,
    minutes: 38,
    category: "self",
    lenses: ["psychology", "philosophy"],
    tags: ["قاب‌بندی مسئله", "خودشناسی"],
    daysAgo: 4,
    plays: 1284,
    featured: true,
  },
  {
    slug: "whose-problem-is-it",
    title: "مسئله‌ی من است یا مسئله‌ی دیگران؟",
    subtitle: "مرز آنچه دست ماست و آنچه نیست",
    description:
      "خیلی وقت‌ها انرژی‌مان را صرف مسئله‌ای می‌کنیم که مال ما نیست و مسئله‌ی خودمان بی‌صاحب می‌ماند. چطور سهم خودمان را از یک موقعیت جدا کنیم؟",
    showNotes: `<p>در هر موقعیت پیچیده چند مسئله روی هم سوار شده‌اند. این اپیزود درباره‌ی جدا کردن آن‌هاست:</p>
<ol>
  <li>چه چیزی را می‌توانم تغییر دهم؟</li>
  <li>روی چه چیزی فقط می‌توانم اثر بگذارم؟</li>
  <li>چه چیزی را باید بپذیرم و رها کنم؟</li>
</ol>
<blockquote>تا مسئله صاحب نداشته باشد، هیچ‌کس حلش نمی‌کند.</blockquote>`,
    minutes: 42,
    category: "others",
    lenses: ["psychology", "sociology"],
    tags: ["مرزگذاری", "روابط"],
    daysAgo: 11,
    plays: 1047,
  },
  {
    slug: "wrong-problem-right-answer",
    title: "جواب درست برای سؤال غلط",
    subtitle: "چرا راه‌حل‌ها جواب نمی‌دهند",
    description:
      "گاهی راه‌حل‌مان خوب است و باز هم چیزی عوض نمی‌شود، چون مسئله را غلط تعریف کرده‌ایم. درباره‌ی رایج‌ترین دام‌های تعریف مسئله و راه بیرون آمدن از آن‌ها.",
    showNotes: `<p>سه دام رایج در تعریف مسئله:</p>
<ul>
  <li>تعریف مسئله با راه‌حلی که از قبل در ذهن داریم.</li>
  <li>اشتباه گرفتن نشانه با علت.</li>
  <li>مسئله‌ای که آن‌قدر بزرگ تعریف شده که هیچ قدم اولی ندارد.</li>
</ul>
<p>در پایان، با «پنج چرا» یک مسئله‌ی واقعی را با هم باز می‌کنیم.</p>`,
    minutes: 35,
    category: "work",
    lenses: ["psychology", "economics"],
    tags: ["قاب‌بندی مسئله", "تصمیم‌گیری"],
    daysAgo: 18,
    plays: 932,
  },
  {
    slug: "one-sentence-problem",
    title: "مسئله را در یک جمله بنویس",
    subtitle: "ابزار ساده‌ای که ذهن را روشن می‌کند",
    description:
      "اگر نتوانیم مسئله‌مان را در یک جمله بگوییم، هنوز آن را نمی‌شناسیم. یک قالب ساده برای نوشتن مسئله و چند مثال واقعی که با هم بازنویسی‌شان می‌کنیم.",
    showNotes: `<p>قالب این اپیزود:</p>
<blockquote>من می‌خواهم … ، اما … ، و این برایم مهم است چون … .</blockquote>
<p>با همین سه تکه، یک نگرانی کلی مثل «از زندگی‌ام راضی نیستم» به جمله‌ای تبدیل می‌شود که قدم بعدی‌اش معلوم است.</p>`,
    minutes: 27,
    category: "self",
    lenses: ["philosophy"],
    tags: ["نوشتن", "قاب‌بندی مسئله"],
    daysAgo: 25,
    plays: 876,
  },
  {
    slug: "fear-without-a-name",
    title: "ترسی که اسم ندارد",
    subtitle: "وقتی تغییر لازم است و قدم برداشته نمی‌شود",
    description:
      "می‌دانیم باید چیزی را عوض کنیم، اما دست نگه می‌داریم. اسم گذاشتن روی ترس، اولین قدم برای کوچک کردن آن است. از نگاه روان‌شناسی و علوم اعصاب به این ایستادن نگاه می‌کنیم.",
    showNotes: `<p>مغز ما ناشناخته را تهدید می‌بیند، حتی وقتی ناشناخته بهتر است. در این اپیزود:</p>
<ul>
  <li>چرا «نمی‌دانم چه می‌شود» از «می‌دانم بد می‌شود» سخت‌تر است.</li>
  <li>نوشتن بدترین سناریو و قیمت واقعی آن.</li>
  <li>قدم‌های آن‌قدر کوچک که ترس جدی‌شان نگیرد.</li>
</ul>`,
    minutes: 44,
    category: "change",
    lenses: ["neuroscience", "psychology"],
    tags: ["ترس", "تغییر"],
    daysAgo: 32,
    plays: 1153,
  },
  {
    slug: "money-number-or-meaning",
    title: "پول؛ عدد است یا معنا؟",
    subtitle: "مسئله‌ی پشت نگرانی‌های مالی",
    description:
      "نگرانی مالی همیشه درباره‌ی عدد حساب نیست. گاهی پشتش امنیت، احترام یا آزادی است. چطور بفهمیم مسئله‌ی واقعی‌مان با پول چیست؟",
    showNotes: `<p>از اقتصاد رفتاری کمک می‌گیریم تا ببینیم چرا تصمیم‌های مالی‌مان همیشه منطقی نیستند و پول برای هر کدام از ما چه معنایی دارد.</p>
<h2>سؤال‌های این اپیزود</h2>
<ol>
  <li>اگر فردا دو برابر درآمد داشتم، دقیقاً چه چیزی عوض می‌شد؟</li>
  <li>از کدام خرج‌هایم هیچ‌وقت پشیمان نشده‌ام؟</li>
</ol>`,
    minutes: 39,
    category: "money",
    lenses: ["economics", "psychology"],
    tags: ["پول", "تصمیم‌گیری"],
    daysAgo: 39,
    plays: 798,
  },
  {
    slug: "when-everything-is-fine",
    title: "وقتی همه‌چیز خوب است و باز خوب نیست",
    subtitle: "دنبال معنا، وسط یک زندگی معمولی",
    description:
      "کار داریم، خانواده داریم، مشکل بزرگی نداریم و باز چیزی کم است. این اپیزود درباره‌ی مسئله‌هایی است که از بیرون دیده نمی‌شوند.",
    showNotes: `<p>از فلسفه و تاریخ کمک می‌گیریم: آدم‌ها در دوره‌های مختلف با این «کم بودن» چه کرده‌اند؟</p>
<blockquote>سؤال درست گاهی از هر جوابی ارزشمندتر است.</blockquote>`,
    minutes: 46,
    category: "meaning",
    lenses: ["philosophy", "history"],
    tags: ["معنا", "خودشناسی"],
    daysAgo: 46,
    plays: 1321,
  },
  {
    slug: "follow-up-is-the-solution",
    title: "پیگیری، نیمه‌ی فراموش‌شده‌ی حل مسئله",
    subtitle: "بعضی مسئله‌ها حل نمی‌شوند، مدیریت می‌شوند",
    description:
      "مسئله را تعریف کردیم و قدم اول را برداشتیم؛ بعد چه؟ درباره‌ی پیگیری، بازبینی و اینکه چطور یک مسئله‌ی قدیمی را دوباره قاب بگیریم.",
    showNotes: `<p>یک روال ساده‌ی هفتگی برای پیگیری مسئله‌هایی که مهم‌اند ولی فوری نیستند:</p>
<ul>
  <li>هر هفته یک سؤال: «این مسئله هنوز همان مسئله است؟»</li>
  <li>ثبت کوچک‌ترین پیشرفت‌ها.</li>
  <li>اجازه دادن به اینکه تعریف مسئله عوض شود.</li>
</ul>`,
    minutes: 33,
    category: "power",
    lenses: ["sociology", "psychology"],
    tags: ["پیگیری", "عادت"],
    daysAgo: 53,
    plays: 664,
  },
  {
    slug: "conversation-you-avoid",
    title: "گفت‌وگویی که از آن فرار می‌کنی",
    subtitle: "",
    description:
      "گاهی مسئله روشن است و فقط یک گفت‌وگو تا حلش فاصله داریم؛ گفت‌وگویی که مدام عقبش می‌اندازیم.",
    showNotes: "",
    minutes: 40,
    category: "others",
    lenses: ["psychology"],
    tags: ["گفت‌وگوی سخت", "روابط"],
    daysAgo: -5,
    plays: 0,
    status: "SCHEDULED",
  },
  {
    slug: "decisions-under-fog",
    title: "تصمیم گرفتن در مه",
    subtitle: "",
    description: "وقتی اطلاعات کافی نداریم و باید تصمیم بگیریم، از کجا شروع کنیم؟",
    showNotes: "",
    minutes: 36,
    category: "change",
    lenses: ["economics"],
    tags: ["تصمیم‌گیری"],
    daysAgo: 0,
    plays: 0,
    status: "DRAFT",
  },
];

const inquiries = [
  {
    name: "سارا احمدی",
    email: "sara.ahmadi@example.com",
    phone: "09121234567",
    collaborationType: "COACHING_INDIVIDUAL",
    timeline: "هرچه زودتر",
    message:
      "چند ماه است حس می‌کنم در مسیرم گیر کرده‌ام ولی نمی‌توانم بگویم دقیقاً چه چیزی. اپیزود «یک چیزی درست نیست» را که شنیدم فکر کردم یک گفت‌وگوی فردی کمکم می‌کند.",
    status: "NEW",
    starred: true,
    hoursAgo: 3,
  },
  {
    name: "امیرحسین کریمی",
    email: "amir.karimi@example.com",
    phone: "09359876543",
    collaborationType: "WORKSHOP",
    timeline: "یک تا سه ماه آینده",
    message:
      "در یک انجمن دانشجویی فعالیم و دنبال یک کارگاه دوساعته درباره‌ی تعریف درست مسئله برای حدود سی نفر هستیم. امکانش هست؟",
    status: "NEW",
    starred: false,
    hoursAgo: 20,
  },
  {
    name: "نگار رضایی",
    email: "negar.rezaei@example.com",
    phone: null,
    collaborationType: "COACHING_TEAM",
    timeline: "تا یک ماه آینده",
    message: "با سه نفر از دوستانم می‌خواهیم یک گفت‌وگوی گروهی داشته باشیم. درباره‌ی زمان و شیوه‌ی برگزاری راهنمایی‌مان می‌کنید؟",
    status: "READ",
    starred: false,
    hoursAgo: 52,
  },
  {
    name: "پویا شریفی",
    email: "pouya.sharifi@example.com",
    phone: "09191112233",
    collaborationType: "SPEAKING",
    timeline: "یک تا سه ماه آینده",
    message: "برای همایش سالانه‌ی کتاب‌خوان‌های شهرمان دنبال یک سخنران نیم‌ساعته هستیم. موضوع آزاد است.",
    status: "REPLIED",
    starred: true,
    hoursAgo: 96,
  },
  {
    name: "مریم توکلی",
    email: "maryam.tavakoli@example.com",
    phone: null,
    collaborationType: "OTHER",
    timeline: "فعلاً در حال بررسی",
    message: "هنوز نمی‌دانم کدام قالب برایم مناسب است. می‌شود اول کوتاه صحبت کنیم؟",
    status: "REPLIED",
    starred: false,
    hoursAgo: 170,
  },
  {
    name: "علی محمدی",
    email: "ali.mohammadi@example.com",
    phone: "09125554433",
    collaborationType: "COACHING_INDIVIDUAL",
    timeline: "تا یک ماه آینده",
    message: "اپیزود ترس از تغییر را شنیدم و خیلی به موقعیتم نزدیک بود. دوست دارم درباره‌اش بیشتر حرف بزنم.",
    status: "ARCHIVED",
    starred: false,
    hoursAgo: 330,
  },
];

/**
 * A silent CBR MP3 of the given length, built by hand so the image needs no
 * ffmpeg: MPEG-2 Layer III, 16 kHz mono, 8 kbps. Each 36-byte frame holds 576
 * samples (36 ms), and an all-zero side info decodes to silence.
 */
function silentMp3(seconds: number): Buffer {
  const frame = Buffer.alloc(36);
  frame.set([0xff, 0xf3, 0x18, 0xc0]);
  return Buffer.concat(Array.from({ length: Math.ceil(seconds / 0.036) }, () => frame));
}

async function main() {
  const show = await db.show.findFirst({ where: { isDefault: true } });
  if (!show) throw new Error("No default show: start the promo copy (promo/up.sh) first.");

  // Private data of the real panel; a fresh session is created below.
  await db.session.deleteMany();
  await db.loginAttempt.deleteMany();

  for (const [index, category] of categories.entries()) {
    await db.category.upsert({ where: { slug: category.slug }, update: {}, create: { ...category, sortOrder: index + 1 } });
  }
  for (const [index, lens] of lenses.entries()) {
    await db.lens.upsert({ where: { slug: lens.slug }, update: {}, create: { ...lens, sortOrder: index + 1 } });
  }

  mkdirSync(join(UPLOAD_DIR, "audio"), { recursive: true });
  // Numbered oldest first; the draft has no number yet.
  const numbered = episodes.filter((episode) => episode.status !== "DRAFT").sort((a, b) => b.daysAgo - a.daysAgo);

  for (const [index, episode] of episodes.entries()) {
    const { slug, title, subtitle, description, showNotes, minutes, daysAgo, plays } = episode;
    const status = episode.status ?? "PUBLISHED";
    const durationSeconds = minutes * 60 + (index * 17) % 60;
    const audioFile = `promo-${slug}.mp3`;
    const audio = silentMp3(durationSeconds);
    writeFileSync(join(UPLOAD_DIR, "audio", audioFile), audio);

    const category = await db.category.findUniqueOrThrow({ where: { slug: episode.category } });
    const data = {
      title,
      subtitle: subtitle || null,
      description,
      showNotes: showNotes || null,
      episodeNumber: status === "DRAFT" ? null : numbered.indexOf(episode) + 1,
      durationSeconds,
      audioUrl: `/uploads/audio/${audioFile}`,
      audioSizeBytes: audio.length,
      audioMimeType: "audio/mpeg",
      status,
      publishedAt: status === "DRAFT" ? null : new Date(Date.now() - daysAgo * DAY),
      featured: episode.featured ?? false,
      playCount: plays,
      categoryId: category.id,
    };
    const record = await db.episode.upsert({
      where: { slug },
      update: data,
      create: { ...data, slug, showId: show.id },
    });

    await db.episodeLens.deleteMany({ where: { episodeId: record.id } });
    const linked = await db.lens.findMany({ where: { slug: { in: episode.lenses } } });
    await db.episodeLens.createMany({ data: linked.map((lens) => ({ episodeId: record.id, lensId: lens.id })) });

    await db.episodeTag.deleteMany({ where: { episodeId: record.id } });
    for (const tagName of episode.tags) {
      const name = normalizeFa(tagName);
      const tag = await db.tag.upsert({ where: { name }, update: {}, create: { name, slug: slugify(name) } });
      await db.episodeTag.create({ data: { episodeId: record.id, tagId: tag.id } });
    }
  }

  await db.inquiry.deleteMany({ where: { email: { endsWith: "@example.com" } } });
  for (const { hoursAgo, ...inquiry } of inquiries) {
    const createdAt = new Date(Date.now() - hoursAgo * 3600000);
    await db.inquiry.create({
      data: {
        ...inquiry,
        createdAt,
        readAt: inquiry.status === "NEW" ? null : createdAt,
        sourcePath: "/collaborate",
      },
    });
  }

  const user = await db.user.findFirstOrThrow({ where: { isActive: true }, orderBy: { createdAt: "asc" } });
  const token = randomBytes(32).toString("base64url");
  await db.session.create({
    data: {
      tokenHash: createHash("sha256").update(token).digest("hex"),
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * DAY),
    },
  });
  writeFileSync(join(DATA_DIR, "admin-session.txt"), token);

  console.info(`[promo] ${episodes.length} episodes, ${inquiries.length} inquiries, admin session ready.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
