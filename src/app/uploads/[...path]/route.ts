import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { extname } from "node:path";
import { Readable } from "node:stream";

import { CONTENT_TYPES, resolveUploadPath } from "@/server/uploads";

/**
 * Serves uploaded files with HTTP Range support. Without byte ranges browsers
 * cannot seek inside an audio file, and podcast directories reject the feed.
 */
async function serve(request: Request, segments: string[], withBody: boolean) {
  const path = resolveUploadPath(segments);
  const info = path ? await stat(path).catch(() => null) : null;
  if (!path || !info?.isFile()) return new Response("Not found", { status: 404 });

  const headers = new Headers({
    "Content-Type": CONTENT_TYPES[extname(path).slice(1).toLowerCase()] ?? "application/octet-stream",
    "Accept-Ranges": "bytes",
    // Filenames are random and never reused, so they are safe to cache forever.
    "Cache-Control": "public, max-age=31536000, immutable",
  });

  const size = info.size;
  const range = request.headers.get("range")?.match(/^bytes=(\d*)-(\d*)$/);
  let start = 0;
  let end = size - 1;
  let status = 200;

  if (range && (range[1] || range[2])) {
    if (range[1]) {
      start = Number(range[1]);
      end = range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
    } else {
      // "bytes=-500" means the last 500 bytes.
      start = Math.max(0, size - Number(range[2]));
    }
    if (start > end || start >= size) {
      return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
    }
    status = 206;
    headers.set("Content-Range", `bytes ${start}-${end}/${size}`);
  }

  headers.set("Content-Length", String(end - start + 1));
  if (!withBody) return new Response(null, { status, headers });

  const stream = Readable.toWeb(createReadStream(path, { start, end })) as ReadableStream;
  return new Response(stream, { status, headers });
}

export async function GET(request: Request, { params }: RouteContext<"/uploads/[...path]">) {
  return serve(request, (await params).path, true);
}

export async function HEAD(request: Request, { params }: RouteContext<"/uploads/[...path]">) {
  return serve(request, (await params).path, false);
}
