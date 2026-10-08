import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/seo";
import { getAllPublishedEpisodes } from "@/server/episodes";
import { getCategories, getTags } from "@/server/taxonomy";

/** Built per request, for the reason described in src/app/feed.xml/route.ts. */
export const dynamic = "force-dynamic";

/**
 * URLs go through absoluteUrl so Persian slugs are percent-encoded, as the
 * sitemap protocol requires. `lastModified` is only given where it is real:
 * the pages that list episodes change when the newest episode does, and the
 * fixed pages (about, contact…) have no honest date, so they carry none
 * rather than claiming to change on every crawl.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [episodes, categories, tags] = await Promise.all([getAllPublishedEpisodes(), getCategories(), getTags()]);
  const latest = episodes.reduce<Date | undefined>(
    (max, episode) => (!max || episode.updatedAt > max ? episode.updatedAt : max),
    undefined,
  );

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), lastModified: latest, changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/episodes"), lastModified: latest, changeFrequency: "weekly", priority: 0.9 },
    { url: absoluteUrl("/categories"), lastModified: latest, changeFrequency: "monthly", priority: 0.7 },
    { url: absoluteUrl("/collaborate"), changeFrequency: "monthly", priority: 0.9 },
    { url: absoluteUrl("/about"), changeFrequency: "monthly", priority: 0.7 },
    { url: absoluteUrl("/contact"), changeFrequency: "yearly", priority: 0.8 },
  ];

  return [
    ...staticRoutes,
    ...episodes.map((episode) => ({
      url: absoluteUrl(`/episodes/${episode.slug}`),
      lastModified: episode.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...categories.map((category) => ({
      url: absoluteUrl(`/categories/${category.slug}`),
      lastModified: category.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...tags.map((tag) => ({
      url: absoluteUrl(`/tags/${tag.slug}`),
      lastModified: tag.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.4,
    })),
  ];
}
