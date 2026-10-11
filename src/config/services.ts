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
    type: "COACHING_INDIVIDUAL",
    title: "گفت‌وگوی فردی",
    summary:
      "برای وقتی که حس می‌کنید چیزی درست نیست، اما هنوز نمی‌دانید دقیقاً چه چیزی؛ در کار، در یک رابطه یا در یک تصمیم.",
    note: "جلسه‌های منظم، تا وقتی مسئله روشن و قابل‌پیگیری شود",
  },
  {
    type: "COACHING_TEAM",
    title: "گفت‌وگوی گروهی",
    summary: "وقتی گره میان چند نفر است و هر کس مسئله را جور دیگری می‌بیند؛ از یک تیم تا شریک‌های یک کار.",
    note: "چند جلسه، با فاصله‌ی کافی میان آن‌ها",
  },
  {
    type: "WORKSHOP",
    title: "کارگاه صورت‌بندی مسئله",
    summary: "برای گروهی که می‌خواهد یاد بگیرد چطور از موقعیتی درهم، مسئله‌ای روشن بیرون بکشد.",
    note: "نیم‌روز تا دو روز، حضوری یا آنلاین",
  },
  {
    type: "SPEAKING",
    title: "سخنرانی",
    summary: "در رویدادهایی که مخاطب‌شان برای فکر کردن آمده است.",
    note: "تعداد محدود در سال",
  },
];

/** The options of the contact form: the offer above, plus «not sure yet». */
export const collaborationChoices: CollaborationType[] = [...services.map((service) => service.type), "OTHER"];

/** What happens in an episode, step by step; shown on the home page. */
export const approachSteps = [
  {
    title: "دیدن موقعیت",
    body: "از جایی شروع می‌کنیم که ایستاده‌ایم: حسی مبهم، اتفاقی که تکرار می‌شود، تصمیمی که عقب می‌افتد. اول، بی‌عجله برای حل کردن، خوب نگاهش می‌کنیم.",
  },
  {
    title: "صورت‌بندی مسئله",
    body: "موقعیت را از دریچه‌های مختلف می‌بینیم تا معلوم شود گره واقعی کجاست. مسئله‌ای که درست صورت‌بندی شود، نیمی از راه را رفته است.",
  },
  {
    title: "قدمی قابل‌پیگیری",
    body: "هر اپیزود با سؤالی روشن و قدمی کوچک تمام می‌شود؛ چیزی که بشود از همین هفته دنبالش کرد و دید چه چیزی را تغییر می‌دهد.",
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
