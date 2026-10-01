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
  category: { select: { slug: true, name: true } },
} as const;

export type EpisodeListItem = Awaited<ReturnType<typeof getEpisodes>>["episodes"][number];

export const PER_PAGE = 9;

export type EpisodeQuery = {
  page?: number;
  perPage?: number;
  /** Slugs. */
  category?: string;
  lens?: string;
  tag?: string;
  search?: string;
  sort?: "newest" | "oldest";
};

export async function getEpisodes({
  page = 1,
  perPage = PER_PAGE,
  category,
  lens,
  tag,
  search,
  sort = "newest",
}: EpisodeQuery = {}) {
  const where = {
    ...publishedWhere(),
    ...(category ? { category: { slug: category } } : {}),
    ...(lens ? { lenses: { some: { lens: { slug: lens } } } } : {}),
    ...(tag ? { tags: { some: { tag: { slug: tag } } } } : {}),
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
      category: { select: { id: true, slug: true, name: true } },
      lenses: { select: { lens: { select: { slug: true, name: true } } }, orderBy: { lens: { sortOrder: "asc" } } },
      tags: { select: { tag: { select: { id: true, slug: true, name: true } } }, orderBy: { tag: { name: "asc" } } },
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
 * Episodes ranked by how many tags they share with the given one, then by
 * being in the same category, then by recency. This is what turns the archive
 * into an internally linked graph rather than a flat list.
 */
export async function getRelatedEpisodes(
  episode: { id: string; categoryId: string | null; tagIds: string[] },
  limit = 3,
) {
  const matches = [
    ...(episode.tagIds.length > 0 ? [{ tags: { some: { tagId: { in: episode.tagIds } } } }] : []),
    ...(episode.categoryId ? [{ categoryId: episode.categoryId }] : []),
  ];

  const candidates =
    matches.length === 0
      ? []
      : await db.episode.findMany({
          where: { ...publishedWhere(), id: { not: episode.id }, OR: matches },
          select: { ...listSelect, categoryId: true, tags: { select: { tagId: true } } },
          orderBy: { publishedAt: "desc" },
        });

  const tagIds = new Set(episode.tagIds);
  const related = candidates
    .map(({ tags, categoryId, ...candidate }) => ({
      candidate,
      sharedTags: tags.filter((link) => tagIds.has(link.tagId)).length,
      sameCategory: categoryId === episode.categoryId ? 1 : 0,
    }))
    // Array.prototype.sort is stable, so equal scores keep the newest-first order.
    .sort((a, b) => b.sharedTags - a.sharedTags || b.sameCategory - a.sameCategory)
    .slice(0, limit)
    .map((entry) => entry.candidate);

  if (related.length >= limit) return related;

  // Top up with recent episodes so the section never looks broken.
  const filler = await db.episode.findMany({
    where: {
      ...publishedWhere(),
      id: { notIn: [episode.id, ...related.map((item) => item.id)] },
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
    include: {
      show: true,
      category: { select: { name: true } },
      tags: { select: { tag: { select: { name: true } } } },
    },
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
