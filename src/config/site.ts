/**
 * Single source of truth for brand, metadata and podcast feed identity.
 *
 * Change a value here once and every page title, OG tag, RSS channel and
 * JSON-LD block follows; the default show row is re-synced on every start.
 */

export type NavItem = {
  href: string;
  label: string;
  /** Shown in the footer sitemap column, hidden from the primary header nav. */
  secondary?: boolean;
};

export const siteConfig = {
  name: "درشان",
  nameLatin: "Darshan",
  tagline: "جور دیگر دیدنِ خود، آدم‌ها و زندگی",
  description:
    "پادکستی درباره‌ی مسئله‌های واقعی آدم‌ها و نگاهی تازه به آن‌ها؛ از دل روان‌شناسی، علوم اعصاب، فلسفه، تاریخ و اقتصاد.",

  /** Public origin. Set NEXT_PUBLIC_SITE_URL in production for correct canonicals. */
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""),

  locale: "fa_IR",
  htmlLang: "fa",
  direction: "rtl" as const,

  author: {
    name: "مهدی منتظری",
    /** Headline used on the home hero and in Person structured data. */
    role: "کوچ، مدرس و مشاور توسعه‌ی فردی و سازمانی",
    email: "mahdii.montazeri@gmail.com",
    /**
     * Real, verifiable credentials (degrees, certifications, notable clients).
     * Left empty on purpose: the About page hides this section until it has
     * true entries, so the site never shows placeholder claims to a recruiter.
     */
    credentials: [] as string[],
  },

  /** Empty strings are skipped everywhere they are rendered. */
  social: {
    linkedin: "",
    instagram: "",
    youtube: "",
    x: "",
    telegram: "",
  },

  /** Directory links rendered on the subscribe strip. Empty values are hidden. */
  listenOn: {
    spotify: "",
    applePodcasts: "",
    googlePodcasts: "",
    castbox: "",
    shenoto: "",
  },

  /** Channel-level values for the generated RSS feed (/feed.xml). */
  podcast: {
    /** Must match an Apple Podcasts category exactly — it is case sensitive. */
    itunesCategory: "Education",
    itunesSubcategory: "Self-Improvement",
    explicit: false,
    language: "fa-IR",
    copyright: `© ${new Date().getFullYear()} درشان`,
    ownerName: "مهدی منتظری",
    ownerEmail: "mahdii.montazeri@gmail.com",
    /** 1400×1400 to 3000×3000 square artwork, served from /public. */
    artwork: "/podcast-artwork.png",
  },
} as const;

export const mainNav: NavItem[] = [
  { href: "/episodes", label: "اپیزودها" },
  { href: "/categories", label: "دسته‌ها" },
  { href: "/about", label: "درباره‌ی من" },
  { href: "/collaborate", label: "همکاری" },
];

export const footerNav: NavItem[] = [
  ...mainNav,
  { href: "/contact", label: "تماس و دعوت به همکاری", secondary: true },
  { href: "/feed.xml", label: "فید RSS", secondary: true },
];

export type SiteConfig = typeof siteConfig;
