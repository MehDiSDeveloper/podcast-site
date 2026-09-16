import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";
import { getAllPublishedEpisodes } from "@/server/episodes";
import { getTopics } from "@/server/topics";

/** Regenerated hourly, and on demand when the admin publishes. */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [episodes, topics] = await Promise.all([getAllPublishedEpisodes(), getTopics()]);
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${siteConfig.url}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${siteConfig.url}/episodes`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${siteConfig.url}/topics`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${siteConfig.url}/collaborate`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${siteConfig.url}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${siteConfig.url}/contact`, lastModified: now, changeFrequency: "yearly", priority: 0.8 },
  ];

  return [
    ...staticRoutes,
    ...episodes.map((episode) => ({
      url: `${siteConfig.url}/episodes/${episode.slug}`,
      lastModified: episode.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...topics.map((topic) => ({
      url: `${siteConfig.url}/topics/${topic.slug}`,
      lastModified: topic.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
