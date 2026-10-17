import { siteConfig } from "@/config/site";
import { toFaDigits } from "@/lib/utils";

/** Query parameter the /uploads route turns into a Content-Disposition filename. */
export const DOWNLOAD_PARAM = "download";

/**
 * Download link for an episode's audio, saved as «درشان - اپیزود ۱ - عنوان.mp3»
 * instead of the random upload filename. Uploaded files get the name from the
 * server (reliable on every browser); external URLs only get the `download`
 * hint, which browsers ignore for other origins.
 */
export function episodeDownload(episode: { title: string; episodeNumber: number | null; audioUrl: string }) {
  const extension = episode.audioUrl.split(/[?#]/)[0].match(/\.(\w+)$/)?.[1] ?? "mp3";
  const parts = [siteConfig.name, episode.episodeNumber ? `اپیزود ${toFaDigits(episode.episodeNumber)}` : null, episode.title];
  const filename = `${safeFileName(parts.filter(Boolean).join(" - "))}.${extension}`;

  const href = episode.audioUrl.startsWith("/uploads/")
    ? `${episode.audioUrl}?${DOWNLOAD_PARAM}=${encodeURIComponent(filename)}`
    : episode.audioUrl;
  return { href, filename };
}

/** Drops characters that file systems or the Content-Disposition header reject. */
export function safeFileName(name: string): string {
  return name
    .replace(/[\u0000-\u001f\u007f"*/:<>?\\|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 150);
}
