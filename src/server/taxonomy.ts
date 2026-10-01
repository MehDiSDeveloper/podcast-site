import "server-only";

import { cache } from "react";

import { db } from "./db";

/**
 * Public read-side queries for the episode taxonomy: one category per episode,
 * any number of lenses (filter only) and tags.
 */

const publishedEpisode = () => ({
  status: "PUBLISHED" as const,
  publishedAt: { lte: new Date() },
});

const byOrder = [{ sortOrder: "asc" as const }, { name: "asc" as const }];

/** Categories that have at least one published episode, with their counts. */
export const getCategories = cache(async () => {
  const categories = await db.category.findMany({
    orderBy: byOrder,
    include: { _count: { select: { episodes: { where: publishedEpisode() } } } },
  });

  return categories
    .map(({ _count, ...category }) => ({ ...category, episodeCount: _count.episodes }))
    .filter((category) => category.episodeCount > 0);
});

export const getCategoryBySlug = cache(async (slug: string) => {
  return db.category.findUnique({ where: { slug } });
});

/** Every category, including empty ones — for static params and admin selects. */
export async function getAllCategories() {
  return db.category.findMany({ orderBy: byOrder });
}

/** Lenses used by at least one published episode, for the archive filter. */
export const getLenses = cache(async () => {
  const lenses = await db.lens.findMany({
    orderBy: byOrder,
    include: { _count: { select: { episodes: { where: { episode: publishedEpisode() } } } } },
  });

  return lenses
    .map(({ _count, ...lens }) => ({ ...lens, episodeCount: _count.episodes }))
    .filter((lens) => lens.episodeCount > 0);
});

/** Tags used by at least one published episode — the ones worth a public page. */
export const getTags = cache(async () => {
  const tags = await db.tag.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { episodes: { where: { episode: publishedEpisode() } } } } },
  });

  return tags
    .map(({ _count, ...tag }) => ({ ...tag, episodeCount: _count.episodes }))
    .filter((tag) => tag.episodeCount > 0);
});

export const getTagBySlug = cache(async (slug: string) => {
  return db.tag.findUnique({ where: { slug } });
});

/** Choices for the admin episode form. */
export async function getEpisodeFormOptions() {
  const [categories, lenses, tags] = await Promise.all([
    db.category.findMany({ orderBy: byOrder, select: { id: true, name: true } }),
    db.lens.findMany({ orderBy: byOrder, select: { id: true, name: true } }),
    db.tag.findMany({ orderBy: { name: "asc" }, select: { name: true } }),
  ]);
  return { categories, lenses, tags: tags.map((tag) => tag.name) };
}
