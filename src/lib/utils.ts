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
    .replace(/[‌\s_]+/g, "-")
    .replace(/[^\p{L}\p{N}-]+/gu, "")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** `3725` -> `"1:02:05"`. Used by the player and by itunes:duration. */
export function formatDuration(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return "0:00";
  const seconds = Math.floor(totalSeconds % 60);
  const minutes = Math.floor((totalSeconds / 60) % 60);
  const hours = Math.floor(totalSeconds / 3600);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`;
}

/** Human duration for cards and screen readers, e.g. «۴۲ دقیقه». */
export function formatDurationLabel(totalSeconds: number): string {
  const minutes = Math.round(totalSeconds / 60);
  if (minutes < 60) return `${minutes} دقیقه`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} ساعت` : `${hours} ساعت و ${rest} دقیقه`;
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
