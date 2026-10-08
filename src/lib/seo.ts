import type { Metadata } from "next";

import { siteConfig } from "@/config/site";

/**
 * Page metadata in one shape.
 *
 * Next merges metadata shallowly: a page that sets `openGraph`, `twitter` or
 * `alternates` replaces the root layout's object whole, which used to drop the
 * share image, site name, locale and RSS link on every inner page and leave
 * the home page's title on its Twitter card. Every public page builds its
 * metadata here instead, so each one carries the full set.
 */

/** Absolute, percent-encoded URL for a site path (Persian slugs included). */
export function absoluteUrl(path: string): string {
  return new URL(path, `${siteConfig.url}/`).href;
}

/** RSS autodiscovery, repeated on every page because `alternates` is replaced, not merged. */
export const feedAlternate = {
  "application/rss+xml": [{ url: "/feed.xml", title: `${siteConfig.name} — فید پادکست` }],
};

/** The site-wide share card, src/app/opengraph-image.tsx. */
const defaultImage = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: `${siteConfig.name} — ${siteConfig.tagline}`,
};

export function pageMetadata({
  title,
  description,
  path,
  type = "website",
  image,
  publishedTime,
}: {
  /** Page title without the brand; the root template adds « | درشان». */
  title: string;
  description: string;
  /** Canonical path. */
  path: string;
  type?: "website" | "article" | "profile";
  /**
   * Replaces the default share image. `false` leaves it out, for a route that
   * has its own opengraph-image file (a config image would win over that file).
   */
  image?: string | false;
  publishedTime?: string;
}): Metadata {
  const shareTitle = `${title} | ${siteConfig.name}`;
  // Even `images: undefined` would hide a route's own opengraph-image file, so leave the key out.
  const images = image === false ? {} : { images: [image ? { url: image } : defaultImage] };

  return {
    title,
    description,
    alternates: { canonical: path, types: feedAlternate },
    openGraph: {
      type,
      locale: siteConfig.locale,
      siteName: siteConfig.name,
      title: shareTitle,
      description,
      url: path,
      ...images,
      ...(type === "article" ? { publishedTime, authors: [siteConfig.author.name] } : {}),
    },
    twitter: { card: "summary_large_image", title: shareTitle, description, ...images },
  };
}
