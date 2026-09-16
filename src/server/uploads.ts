import "server-only";

import { randomBytes } from "node:crypto";
import { createWriteStream } from "node:fs";
import { mkdir, unlink } from "node:fs/promises";
import { isAbsolute, join, resolve, sep } from "node:path";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { ReadableStream as NodeReadableStream } from "node:stream/web";

/**
 * Local file storage for uploaded audio and images.
 *
 * Files live outside public/ because Next.js only serves public files that
 * existed at build time. They are served back by the /uploads route handler.
 * Moving to S3/R2 later means replacing this module and that route only.
 */

export const UPLOAD_KINDS = {
  audio: {
    maxBytes: 300 * 1024 * 1024,
    types: {
      "audio/mpeg": "mp3",
      "audio/mp4": "m4a",
      "audio/x-m4a": "m4a",
      "audio/aac": "aac",
      "audio/ogg": "ogg",
      "audio/wav": "wav",
    },
  },
  image: {
    maxBytes: 5 * 1024 * 1024,
    types: { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" },
  },
} as const;

export type UploadKind = keyof typeof UPLOAD_KINDS;

/** File extension -> MIME type, for serving files back. */
export const CONTENT_TYPES: Record<string, string> = Object.fromEntries(
  Object.values(UPLOAD_KINDS).flatMap((kind) => Object.entries(kind.types).map(([type, ext]) => [ext, type])),
);

export function uploadRoot(): string {
  const dir = process.env.UPLOAD_DIR || "storage/uploads";
  // Runtime-only paths: tell the bundler's file tracer not to follow them.
  return isAbsolute(dir) ? dir : resolve(/*turbopackIgnore: true*/ process.cwd(), dir);
}

/** Resolves an /uploads path to disk, refusing anything that escapes the root. */
export function resolveUploadPath(segments: string[]): string | null {
  const root = uploadRoot();
  const target = resolve(/*turbopackIgnore: true*/ root, ...segments);
  return target.startsWith(root + sep) ? target : null;
}

export class UploadError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

/** Streams a request body to disk without buffering the whole file in memory. */
export async function saveUpload(kind: UploadKind, contentType: string, body: ReadableStream<Uint8Array>) {
  const config = UPLOAD_KINDS[kind];
  const mime = contentType.split(";")[0].trim().toLowerCase();
  const ext = (config.types as Record<string, string>)[mime];
  if (!ext) throw new UploadError("نوع این فایل پشتیبانی نمی‌شود.", 415);

  const dir = join(uploadRoot(), kind);
  await mkdir(dir, { recursive: true });

  const name = `${Date.now().toString(36)}-${randomBytes(6).toString("hex")}.${ext}`;
  const path = join(dir, name);

  let bytes = 0;
  const limiter = new Transform({
    transform(chunk: Buffer, _encoding, callback) {
      bytes += chunk.length;
      if (bytes > config.maxBytes) callback(new UploadError("حجم فایل بیش از حد مجاز است.", 413));
      else callback(null, chunk);
    },
  });

  try {
    await pipeline(Readable.fromWeb(body as NodeReadableStream), limiter, createWriteStream(path));
  } catch (error) {
    await unlink(path).catch(() => undefined);
    throw error instanceof UploadError ? error : new UploadError("ذخیره‌ی فایل ناموفق بود.", 500);
  }

  return { url: `/uploads/${kind}/${name}`, size: bytes, type: mime };
}

/** Best-effort removal of a file we stored; external URLs are left alone. */
export async function deleteUpload(url: string | null | undefined) {
  if (!url?.startsWith("/uploads/")) return;
  const path = resolveUploadPath(url.slice("/uploads/".length).split("/"));
  if (path) await unlink(path).catch(() => undefined);
}
