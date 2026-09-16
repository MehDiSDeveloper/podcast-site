import type { CollaborationType } from "@/lib/enums";

/**
 * The collaboration offer, in one place.
 *
 * Home, /collaborate, the contact form and the ProfessionalService JSON-LD all
 * read from here, so the positioning stays identical everywhere a hiring
 * manager might land. Each entry is written outcome-first — what the team gets
 * — because that is what shortens the decision, not a description of method.
 */

export type Service = {
  /** Matches the contact form's collaboration type, so a card can deep-link. */
  type: CollaborationType;
  title: string;
  /** One line under the title. */
  summary: string;
  /** Who this is for — helps the visitor self-select quickly. */
  audience: string;
  /** Concrete outcomes. Three is the sweet spot for scannability. */
  outcomes: string[];
  format: string;
};

export const services: Service[] = [
  {
    type: "COACHING_INDIVIDUAL",
    title: "کوچینگ فردی مدیران",
    summary: "همراهی یک‌به‌یک برای مدیرانی که در نقش تازه یا تصمیم سختی گیر کرده‌اند.",
    audience: "مدیران میانی و ارشد، بنیان‌گذاران",
    outcomes: [
      "روشن‌شدن مسئله‌ی واقعی، جدا از آنچه روی سطح دیده می‌شود",
      "تصمیم‌گیری سریع‌تر در موقعیت‌های مبهم",
      "الگوهای رفتاری‌ای که مدام هزینه می‌سازند، شناسایی و اصلاح می‌شوند",
    ],
    format: "جلسات ۶۰ دقیقه‌ای، دوره‌ی سه تا شش ماهه",
  },
  {
    type: "COACHING_TEAM",
    title: "کوچینگ تیمی",
    summary: "کار روی الگوهای ارتباطی تیم، نه فقط روی افراد.",
    audience: "تیم‌های محصول، فروش، فنی و مدیریتی",
    outcomes: [
      "تعارض‌های تکرارشونده به گفت‌وگوی قابل‌مدیریت تبدیل می‌شوند",
      "نقش‌ها و انتظارها شفاف می‌شوند",
      "بازخورد دادن در تیم از یک رویداد سالانه به عادت روزمره تبدیل می‌شود",
    ],
    format: "جلسات گروهی دوهفته‌ای، دوره‌ی سه ماهه",
  },
  {
    type: "WORKSHOP",
    title: "کارگاه و دوره‌ی آموزشی",
    summary: "کارگاه‌های عملی با محتوای مبتنی بر شواهد، متناسب با بافت سازمان شما.",
    audience: "سازمان‌ها، تیم‌های منابع انسانی، رویدادهای درون‌سازمانی",
    outcomes: [
      "چارچوب‌های قابل‌استفاده از همان روز بعد، نه مفاهیم انتزاعی",
      "تمرین روی مسئله‌های واقعی خودِ تیم",
      "زبان مشترکی که بعد از کارگاه در سازمان باقی می‌ماند",
    ],
    format: "نیم‌روزه تا دوروزه، حضوری یا آنلاین",
  },
  {
    type: "CONSULTING",
    title: "مشاوره‌ی سازمانی",
    summary: "بررسی یک مسئله‌ی مشخص سازمانی و طراحی مسیر حل آن.",
    audience: "مدیران ارشد و تیم‌های منابع انسانی",
    outcomes: [
      "تشخیص ریشه‌ی مسئله به‌جای درمان نشانه‌ها",
      "طرح اجرایی با گام‌های مشخص و قابل‌سنجش",
      "همراهی در اجرا تا جایی که تغییر پایدار شود",
    ],
    format: "پروژه‌ای، معمولاً شش تا دوازده هفته",
  },
  {
    type: "SPEAKING",
    title: "سخنرانی در رویداد",
    summary: "سخنرانی‌هایی که مخاطب را با یک ایده‌ی قابل‌اجرا ترک می‌کنند.",
    audience: "همایش‌ها، رویدادهای سازمانی، گردهمایی‌های تیمی",
    outcomes: [
      "یک ایده‌ی محوری روشن، نه فهرستی از نکته‌ها",
      "روایت و شواهد، کنار هم",
      "پرسش و پاسخ واقعی با مخاطب",
    ],
    format: "۳۰ تا ۶۰ دقیقه",
  },
];

/** The problem areas the podcast covers, used on the home page. */
export const problemAreas = [
  {
    title: "تعارض‌هایی که حل نمی‌شوند",
    body: "وقتی یک اختلاف برای چندمین بار برمی‌گردد، مسئله دیگر موضوع نیست؛ الگوست. کار روی آن الگو، تیم را از بن‌بست بیرون می‌آورد.",
  },
  {
    title: "انرژی و تمرکزی که ته می‌کشد",
    body: "توجه کمیاب‌ترین منبع سازمان است. طراحی کار به شکلی که با مغز انسان سر جنگ نداشته باشد، خروجی را بیشتر از هر ابزار تازه‌ای بالا می‌برد.",
  },
  {
    title: "انگیزه‌ای که با شعار ساخته نمی‌شود",
    body: "انگیزه‌ی پایدار محصول محیط است، نه سخنرانی. شواهد نشان می‌دهند کدام شرایط آن را می‌سازند و کدام‌ها خاموشش می‌کنند.",
  },
];

/** Disciplines the content draws on — shown as a credibility strip. */
export const disciplines = [
  "روان‌شناسی",
  "علوم اعصاب",
  "فلسفه",
  "تاریخ",
  "اقتصاد رفتاری",
];
