import type { CollaborationType } from "@/lib/enums";

/**
 * The collaboration offer, in one place.
 *
 * /collaborate, the contact form and the ProfessionalService JSON-LD all read
 * from here. The register is deliberately quiet: the podcast is the portfolio,
 * so these entries name the kinds of work and leave the selling out — no outcome
 * checklists, no process and never any talk of fees.
 */

export type Service = {
  /** Matches the contact form's collaboration type. */
  type: CollaborationType;
  title: string;
  /** One sentence: the situation this kind of work is for. */
  summary: string;
  /** Rhythm and scale, stated plainly. */
  note: string;
};

export const services: Service[] = [
  {
    type: "CONSULTING",
    title: "مسئله‌ی سازمانی",
    summary:
      "برای مسئله‌ای مشخص که چند بار «حل» شده و باز برگشته است؛ از فهم ریشه تا همراهی در اجرا.",
    note: "پروژه‌ای، معمولاً چند هفته تا چند ماه",
  },
  {
    type: "COACHING_INDIVIDUAL",
    title: "همراهی فردی",
    summary: "برای مدیری که با تصمیمی دشوار یا نقشی تازه، بیش از آنچه نشان می‌دهد تنهاست.",
    note: "جلسات منظم، در طول چند ماه",
  },
  {
    type: "COACHING_TEAM",
    title: "کار با تیم",
    summary: "وقتی گره میان آدم‌هاست، نه درون یک نفر؛ و گفت‌وگوهای مهم دیگر اتفاق نمی‌افتند.",
    note: "دوره‌ای، با فاصله‌ی کافی میان جلسات",
  },
  {
    type: "WORKSHOP",
    title: "کارگاه",
    summary: "برای سازمانی که به زبانی مشترک نیاز دارد، نه به یک روز انگیزشی.",
    note: "نیم‌روز تا دو روز، حضوری یا آنلاین",
  },
  {
    type: "SPEAKING",
    title: "سخنرانی",
    summary: "در رویدادهایی که مخاطب‌شان برای فکر کردن آمده است.",
    note: "تعداد محدود در سال",
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
