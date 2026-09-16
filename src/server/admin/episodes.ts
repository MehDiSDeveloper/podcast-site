import "server-only";

import type { EpisodeStatus } from "@/lib/enums";
import { slugify } from "@/lib/utils";
import type { EpisodeInput } from "@/lib/validation/episode";

import { db } from "../db";

/** Admin-side episode data access. Unlike src/server/episodes.ts, sees drafts. */

export async function listAdminEpisodes({ status }: { status?: EpisodeStatus } = {}) {
  return db.episode.findMany({
    where: status ? { status } : undefined,
    orderBy: [{ publishedAt: { sort: "desc", nulls: "first" } }, { createdAt: "desc" }],
    select: {
      id: true,
      slug: true,
      title: true,
      episodeNumber: true,
      status: true,
      publishedAt: true,
      playCount: true,
      featured: true,
      durationSeconds: true,
    },
  });
}

export async function getAdminEpisode(id: string) {
  return db.episode.findUnique({
    where: { id },
    include: { topics: { select: { topicId: true } } },
  });
}

/** Picks a free slug, appending -2, -3… when the base is already taken. */
async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  const root = slugify(base) || `episode-${Date.now().toString(36)}`;
  for (let attempt = 1; ; attempt += 1) {
    const candidate = attempt === 1 ? root : `${root}-${attempt}`;
    const clash = await db.episode.findFirst({
      where: { slug: candidate, ...(excludeId ? { id: { not: excludeId } } : {}) },
      select: { id: true },
    });
    if (!clash) return candidate;
  }
}

/**
 * Podcast directories require the enclosure's byte length. For externally
 * hosted audio we can learn it with a HEAD request instead of asking the admin.
 */
async function probeRemoteSize(url: string): Promise<number> {
  if (!/^https?:\/\//.test(url)) return 0;
  try {
    const response = await fetch(url, { method: "HEAD", redirect: "follow", signal: AbortSignal.timeout(5000) });
    return Number(response.headers.get("content-length") ?? 0) || 0;
  } catch {
    return 0;
  }
}

export async function saveEpisode(input: EpisodeInput, id?: string) {
  const show = await db.show.findFirst({ where: { isDefault: true }, select: { id: true } });
  if (!show) throw new Error("Default show is missing; restart the server to run bootstrap.");

  const slug = await uniqueSlug(input.slug || input.title, id);
  const audioSizeBytes = input.audioSizeBytes || (await probeRemoteSize(input.audioUrl));

  // Publishing without a date means "now"; a draft keeps whatever it had.
  const publishedAt =
    input.publishedAt ?? (input.status === "PUBLISHED" ? new Date() : null);

  const data = {
    slug,
    title: input.title,
    subtitle: input.subtitle ?? null,
    description: input.description,
    showNotes: input.showNotes ?? null,
    transcript: input.transcript ?? null,
    audioUrl: input.audioUrl,
    audioSizeBytes,
    audioMimeType: input.audioMimeType,
    durationSeconds: input.durationSeconds,
    coverImage: input.coverImage ?? null,
    episodeNumber: input.episodeNumber ?? null,
    seasonNumber: input.seasonNumber ?? null,
    episodeType: input.episodeType,
    status: input.status,
    publishedAt,
    featured: input.featured,
    explicit: input.explicit,
    seoTitle: input.seoTitle ?? null,
    seoDescription: input.seoDescription ?? null,
  };

  return db.$transaction(async (tx) => {
    const episode = id
      ? await tx.episode.update({ where: { id }, data })
      : await tx.episode.create({ data: { ...data, showId: show.id } });

    // Only one featured episode at a time — it drives the home page hero.
    if (input.featured) {
      await tx.episode.updateMany({ where: { featured: true, id: { not: episode.id } }, data: { featured: false } });
    }

    await tx.episodeTopic.deleteMany({ where: { episodeId: episode.id } });
    if (input.topicIds.length > 0) {
      const valid = await tx.topic.findMany({ where: { id: { in: input.topicIds } }, select: { id: true } });
      await tx.episodeTopic.createMany({
        data: valid.map((topic) => ({ episodeId: episode.id, topicId: topic.id })),
      });
    }

    return episode;
  });
}

export async function deleteEpisode(id: string) {
  return db.episode.delete({ where: { id } });
}
