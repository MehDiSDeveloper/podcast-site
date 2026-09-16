import "server-only";

import { cache } from "react";

import type { PlayerTrack } from "@/components/player/player-provider";

import { db } from "./db";

/**
 * Read-side queries for episodes.
 *
 * Everything public goes through `publishedWhere` so a draft or a scheduled
 * episode can never leak into a listing, a feed, the sitemap or a detail page.
 */

const publishedWhere = () => ({
  status: "PUBLISHED" as const,
  publishedAt: { lte: new Date() },
});

const listSelect = {
  id: true,
  slug: true,
  title: true,
  subtitle: true,
  description: true,
  coverImage: true,
  audioUrl: true,
  durationSeconds: true,
  episodeNumber: true,
  seasonNumber: true,
  publishedAt: true,
  featured: true,
  topics: { select: { topic: { select: { slug: true, name: true } } } },
} as const;

export type EpisodeListItem = Awaited<ReturnType<typeof getEpisodes>>["episodes"][number];

export const PER_PAGE = 9;

export type EpisodeQuery = {
  page?: number;
  perPage?: number;
  topic?: string;
  search?: string;
  sort?: "newest" | "oldest";
};

export async function getEpisodes({
  page = 1,
  perPage = PER_PAGE,
  topic,
  search,
  sort = "newest",
}: EpisodeQuery = {}) {
  const where = {
    ...publishedWhere(),
    ...(topic ? { topics: { some: { topic: { slug: topic } } } } : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search } },
            { subtitle: { contains: search } },
            { description: { contains: search } },
            { showNotes: { contains: search } },
          ],
        }
      : {}),
  };

  const [episodes, total] = await Promise.all([
    db.episode.findMany({
      where,
      select: listSelect,
      orderBy: { publishedAt: sort === "oldest" ? "asc" : "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    db.episode.count({ where }),
  ]);

  return {
    episodes,
    total,
    page,
    perPage,
    pageCount: Math.max(1, Math.ceil(total / perPage)),
  };
}

/** `cache` dedupes this across the page and its generateMetadata call. */
export const getEpisodeBySlug = cache(async (slug: string) => {
  return db.episode.findFirst({
    where: { slug, ...publishedWhere() },
    include: {
      show: true,
      topics: { select: { topic: { select: { id: true, slug: true, name: true } } } },
    },
  });
});

export const getFeaturedEpisode = cache(async () => {
  // Fall back to the newest episode so the home hero is never empty.
  const featured = await db.episode.findFirst({
    where: { ...publishedWhere(), featured: true },
    select: listSelect,
    orderBy: { publishedAt: "desc" },
  });

  return (
    featured ??
    db.episode.findFirst({
      where: publishedWhere(),
      select: listSelect,
      orderBy: { publishedAt: "desc" },
    })
  );
});

export async function getLatestEpisodes(limit = 6, excludeId?: string) {
  return db.episode.findMany({
    where: { ...publishedWhere(), ...(excludeId ? { id: { not: excludeId } } : {}) },
    select: listSelect,
    orderBy: { publishedAt: "desc" },
    take: limit,
  });
}

/**
 * Episodes sharing at least one topic with the given one. This is what turns
 * the archive into an internally linked graph rather than a flat list.
 */
export async function getRelatedEpisodes(episodeId: string, topicIds: string[], limit = 3) {
  if (topicIds.length === 0) return getLatestEpisodes(limit, episodeId);

  const related = await db.episode.findMany({
    where: {
      ...publishedWhere(),
      id: { not: episodeId },
      topics: { some: { topicId: { in: topicIds } } },
    },
    select: listSelect,
    orderBy: { publishedAt: "desc" },
    take: limit,
  });

  if (related.length >= limit) return related;

  // Top up with recent episodes so the section never looks broken.
  const filler = await db.episode.findMany({
    where: {
      ...publishedWhere(),
      id: { notIn: [episodeId, ...related.map((episode) => episode.id)] },
    },
    select: listSelect,
    orderBy: { publishedAt: "desc" },
    take: limit - related.length,
  });

  return [...related, ...filler];
}

/** Used by generateStaticParams, the sitemap and the RSS feed. */
export async function getAllPublishedEpisodes() {
  return db.episode.findMany({
    where: publishedWhere(),
    include: { show: true, topics: { select: { topic: { select: { slug: true, name: true } } } } },
    orderBy: { publishedAt: "desc" },
  });
}

export async function getPublishedEpisodeCount() {
  return db.episode.count({ where: publishedWhere() });
}

/** Narrows a full episode row down to what the client player needs. */
export function toPlayerTrack(episode: {
  id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  audioUrl: string;
  coverImage?: string | null;
  durationSeconds: number;
  episodeNumber?: number | null;
}): PlayerTrack {
  return {
    id: episode.id,
    slug: episode.slug,
    title: episode.title,
    subtitle: episode.subtitle ?? null,
    audioUrl: episode.audioUrl,
    coverImage: episode.coverImage ?? null,
    durationSeconds: episode.durationSeconds,
    episodeNumber: episode.episodeNumber ?? null,
  };
}
