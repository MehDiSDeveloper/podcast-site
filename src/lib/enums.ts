/**
 * SQLite has no native enums, so status-like columns are plain strings.
 * These constants are the single source of truth for their allowed values and
 * their Persian labels, and are reused by zod schemas, the admin UI and filters.
 */

export const EPISODE_STATUSES = ["DRAFT", "SCHEDULED", "PUBLISHED"] as const;
export type EpisodeStatus = (typeof EPISODE_STATUSES)[number];

export const EPISODE_STATUS_LABELS: Record<EpisodeStatus, string> = {
  DRAFT: "پیش‌نویس",
  SCHEDULED: "زمان‌بندی‌شده",
  PUBLISHED: "منتشرشده",
};

export const EPISODE_TYPES = ["full", "trailer", "bonus"] as const;
export type EpisodeType = (typeof EPISODE_TYPES)[number];

export const EPISODE_TYPE_LABELS: Record<EpisodeType, string> = {
  full: "اپیزود کامل",
  trailer: "تیزر",
  bonus: "اپیزود ویژه",
};

export const COLLABORATION_TYPES = [
  "COACHING_INDIVIDUAL",
  "COACHING_TEAM",
  "WORKSHOP",
  "CONSULTING",
  "SPEAKING",
  "OTHER",
] as const;
export type CollaborationType = (typeof COLLABORATION_TYPES)[number];

export const COLLABORATION_TYPE_LABELS: Record<CollaborationType, string> = {
  COACHING_INDIVIDUAL: "کوچینگ فردی مدیران",
  COACHING_TEAM: "کوچینگ تیمی",
  WORKSHOP: "کارگاه و دوره‌ی آموزشی",
  CONSULTING: "مشاوره‌ی سازمانی",
  SPEAKING: "سخنرانی در رویداد",
  OTHER: "موضوع دیگر",
};

export const INQUIRY_STATUSES = ["NEW", "READ", "REPLIED", "ARCHIVED"] as const;
export type InquiryStatus = (typeof INQUIRY_STATUSES)[number];

export const INQUIRY_STATUS_LABELS: Record<InquiryStatus, string> = {
  NEW: "جدید",
  READ: "خوانده‌شده",
  REPLIED: "پاسخ داده‌شده",
  ARCHIVED: "بایگانی",
};

export const TEAM_SIZES = ["۱ نفر", "۲ تا ۱۰ نفر", "۱۱ تا ۵۰ نفر", "۵۱ تا ۲۰۰ نفر", "بیش از ۲۰۰ نفر"] as const;

export const TIMELINES = [
  "هرچه زودتر",
  "تا یک ماه آینده",
  "یک تا سه ماه آینده",
  "فعلاً در حال بررسی",
] as const;

export const USER_ROLES = ["ADMIN", "EDITOR"] as const;
export type UserRole = (typeof USER_ROLES)[number];
