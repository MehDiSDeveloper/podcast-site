import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";
import { getAllPublishedEpisodes } from "@/server/episodes";
import { getCategories, getTags } from "@/server/taxonomy";

/** Built per request, for the reason described in src/app/feed.xml/route.ts. */
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [episodes, categories, tags] = await Promise.all([getAllPublishedEpisodes(), getCategories(), getTags()]);
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${siteConfig.url}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${siteConfig.url}/episodes`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${siteConfig.url}/categories`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
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
    ...categories.map((category) => ({
      url: `${siteConfig.url}/categories/${category.slug}`,
      lastModified: category.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...tags.map((tag) => ({
      url: `${siteConfig.url}/tags/${tag.slug}`,
      lastModified: tag.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.4,
    })),
  ];
}
