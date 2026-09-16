import "server-only";

import { cache } from "react";

import { db } from "./db";

const publishedEpisodes = {
  status: "PUBLISHED" as const,
  publishedAt: { lte: new Date() },
};

/** Topics that have at least one published episode, with their counts. */
export const getTopics = cache(async () => {
  const topics = await db.topic.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      _count: { select: { episodes: { where: { episode: publishedEpisodes } } } },
    },
  });

  return topics
    .map((topic) => ({ ...topic, episodeCount: topic._count.episodes }))
    .filter((topic) => topic.episodeCount > 0);
});

export const getTopicBySlug = cache(async (slug: string) => {
  return db.topic.findUnique({ where: { slug } });
});

/** Every topic, including empty ones — for the admin panel and filter chips. */
export async function getAllTopics() {
  return db.topic.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
}
