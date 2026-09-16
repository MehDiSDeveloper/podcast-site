/**
 * Browser helpers for the admin media fields.
 */

export type UploadedFile = { url: string; size: number; type: string };

/**
 * Uploads a file as a raw body. XHR rather than fetch because fetch still has
 * no upload progress events, and a 100MB episode without a progress bar feels
 * broken.
 */
export function uploadFile(
  file: File,
  kind: "audio" | "image",
  onProgress?: (fraction: number) => void,
): Promise<UploadedFile> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `/api/admin/uploads?kind=${kind}`);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    xhr.responseType = "json";

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(event.loaded / event.total);
    };
    xhr.onload = () => {
      const body = xhr.response as (UploadedFile & { error?: string }) | null;
      if (xhr.status >= 200 && xhr.status < 300 && body?.url) resolve(body);
      else reject(new Error(body?.error ?? "بارگذاری ناموفق بود."));
    };
    xhr.onerror = () => reject(new Error("ارتباط با سرور برقرار نشد."));
    xhr.send(file);
  });
}

/**
 * Reads an audio file's duration from its metadata, so the admin never has to
 * type it in. Works for local files (object URLs) and remote URLs alike —
 * reading duration does not require CORS.
 */
export function detectAudioDuration(source: File | string): Promise<number | null> {
  return new Promise((resolve) => {
    const audio = new Audio();
    const url = typeof source === "string" ? source : URL.createObjectURL(source);
    const done = (value: number | null) => {
      if (typeof source !== "string") URL.revokeObjectURL(url);
      audio.removeAttribute("src");
      resolve(value);
    };
    const timer = setTimeout(() => done(null), 15000);

    audio.preload = "metadata";
    audio.onloadedmetadata = () => {
      clearTimeout(timer);
      done(Number.isFinite(audio.duration) ? Math.round(audio.duration) : null);
    };
    audio.onerror = () => {
      clearTimeout(timer);
      done(null);
    };
    audio.src = url;
  });
}

/** "1:02:05" | "62:05" | "3725" -> seconds; null when unparseable. */
export function parseDuration(text: string): number | null {
  const normalised = text.trim().replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)));
  if (!normalised) return null;
  if (/^\d+$/.test(normalised)) return Number(normalised);
  const parts = normalised.split(":");
  if (parts.length > 3 || parts.some((part) => !/^\d+$/.test(part))) return null;
  return parts.reduce((total, part) => total * 60 + Number(part), 0);
}

export function formatBytes(bytes: number): string {
  if (!bytes) return "—";
  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** exponent).toFixed(exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}
