import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge conditional class names, with later Tailwind utilities winning. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Turn a title into a URL-safe slug, keeping Persian/Arabic letters intact. */
export function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[\u200C\s_]+/g, "-")
    .replace(/[^\p{L}\p{N}-]+/gu, "")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Canonical form for Persian names typed by hand: Arabic ي/ى/ك become Persian
 * ی/ک, and runs of whitespace (including stray zero-width non-joiners next to
 * spaces) collapse to one space. Tags are matched on this form, so the same
 * word typed on an Arabic keyboard does not create a duplicate.
 */
export function normalizeFa(input: string): string {
  return input
    .replace(/[\u064A\u0649]/g, "\u06CC")
    .replace(/\u0643/g, "\u06A9")
    .replace(/\u200C{2,}/g, "\u200C")
    .replace(/\u200C?\s+\u200C?/g, " ")
    .replace(/^\u200C+|\u200C+$/g, "")
    .trim();
}

/**
 * Route params arrive percent-encoded when the URL has non-ASCII characters,
 * so a Persian slug must be decoded before it is looked up.
 */
export function decodeSlug(slug: string): string {
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}

const FA_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

/**
 * Latin digits -> Persian digits.
 *
 * Intl already localises dates, but numbers we interpolate ourselves (counts,
 * durations, episode numbers) would otherwise mix «۱۸ شهریور» with «41 دقیقه»
 * on the same line. Everything user-facing goes through this.
 */
export function toFaDigits(input: string | number): string {
  return String(input).replace(/[0-9]/g, (digit) => FA_DIGITS[Number(digit)]);
}

/**
 * `3725` -> `"1:02:05"`, with Latin digits. Used by itunes:duration, which
 * must be machine-readable; use `formatClock` for anything shown on screen.
 */
export function formatDuration(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return "0:00";
  const seconds = Math.floor(totalSeconds % 60);
  const minutes = Math.floor((totalSeconds / 60) % 60);
  const hours = Math.floor(totalSeconds / 3600);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`;
}

/** On-screen clock for the player, e.g. «۱:۰۲:۰۵». */
export function formatClock(totalSeconds: number): string {
  return toFaDigits(formatDuration(totalSeconds));
}

/** Human duration for cards and screen readers, e.g. «۴۲ دقیقه». */
export function formatDurationLabel(totalSeconds: number): string {
  const minutes = Math.max(1, Math.round(totalSeconds / 60));
  if (minutes < 60) return `${toFaDigits(minutes)} دقیقه`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0
    ? `${toFaDigits(hours)} ساعت`
    : `${toFaDigits(hours)} ساعت و ${toFaDigits(rest)} دقیقه`;
}

const persianDate = new Intl.DateTimeFormat("fa-IR", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

/** Jalali display date. Uses the platform ICU — no date library needed. */
export function formatDate(date: Date | string): string {
  return persianDate.format(typeof date === "string" ? new Date(date) : date);
}

// The server runs in UTC; the owner reads times in Tehran.
const persianDateTime = new Intl.DateTimeFormat("fa-IR", {
  year: "numeric",
  month: "long",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Tehran",
});

/** Jalali date and Tehran time, e.g. «۲۸ شهریور ۱۴۰۵، ۱۳:۵۱». */
export function formatDateTime(date: Date | string): string {
  return persianDateTime.format(typeof date === "string" ? new Date(date) : date);
}

/** Machine-readable date for <time dateTime> and structured data. */
export function toISODate(date: Date | string): string {
  return (typeof date === "string" ? new Date(date) : date).toISOString();
}

/** Trim to a whole word near `max` characters, for meta descriptions. */
export function truncate(input: string, max = 160): string {
  const clean = input.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

/** Rough reading time for show notes, tuned for Persian prose. */
export function readingMinutes(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
