import { siteConfig } from "@/config/site";

/**
 * JSON-LD builders.
 *
 * Google indexes the web pages, not the RSS feed, so every public page carries
 * the schema.org type that matches it: PodcastSeries on the show pages,
 * PodcastEpisode on each episode (pointing back at the series via
 * `partOfSeries`), Person for the author, and a BreadcrumbList everywhere so
 * the site hierarchy is explicit.
 */

const absolute = (path: string) =>
  path.startsWith("http") ? path : `${siteConfig.url}${path.startsWith("/") ? path : `/${path}`}`;

export const PERSON_ID = `${siteConfig.url}/#person`;
export const SERIES_ID = `${siteConfig.url}/#podcast`;
export const WEBSITE_ID = `${siteConfig.url}/#website`;

export function personSchema() {
  const sameAs = Object.values(siteConfig.social).filter(Boolean);

  return {
    "@type": "Person",
    "@id": PERSON_ID,
    name: siteConfig.author.name,
    jobTitle: siteConfig.author.role,
    description: siteConfig.description,
    url: siteConfig.url,
    email: `mailto:${siteConfig.author.email}`,
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };
}

export function websiteSchema() {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: siteConfig.url,
    name: siteConfig.name,
    description: siteConfig.description,
    inLanguage: siteConfig.podcast.language,
    publisher: { "@id": PERSON_ID },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteConfig.url}/episodes?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function podcastSeriesSchema() {
  return {
    "@type": "PodcastSeries",
    "@id": SERIES_ID,
    name: siteConfig.name,
    description: siteConfig.description,
    url: absolute("/episodes"),
    webFeed: absolute("/feed.xml"),
    inLanguage: siteConfig.podcast.language,
    image: absolute(siteConfig.podcast.artwork),
    author: { "@id": PERSON_ID },
    publisher: { "@id": PERSON_ID },
  };
}

export function podcastEpisodeSchema(episode: {
  slug: string;
  title: string;
  description: string;
  publishedAt: Date | null;
  durationSeconds: number;
  audioUrl: string;
  audioMimeType: string;
  coverImage?: string | null;
  episodeNumber?: number | null;
  seasonNumber?: number | null;
  transcript?: string | null;
  topics?: { name: string }[];
}) {
  const url = absolute(`/episodes/${episode.slug}`);

  return {
    "@type": "PodcastEpisode",
    "@id": `${url}#episode`,
    url,
    name: episode.title,
    description: episode.description,
    inLanguage: siteConfig.podcast.language,
    ...(episode.publishedAt ? { datePublished: episode.publishedAt.toISOString() } : {}),
    ...(episode.episodeNumber ? { episodeNumber: episode.episodeNumber } : {}),
    ...(episode.seasonNumber ? { seasonNumber: episode.seasonNumber } : {}),
    ...(episode.coverImage ? { image: absolute(episode.coverImage) } : { image: absolute(siteConfig.podcast.artwork) }),
    ...(episode.topics?.length ? { keywords: episode.topics.map((topic) => topic.name).join("، ") } : {}),
    ...(episode.transcript ? { transcript: episode.transcript } : {}),
    timeRequired: isoDuration(episode.durationSeconds),
    partOfSeries: { "@id": SERIES_ID },
    author: { "@id": PERSON_ID },
    associatedMedia: {
      "@type": "AudioObject",
      contentUrl: absolute(episode.audioUrl),
      encodingFormat: episode.audioMimeType,
      duration: isoDuration(episode.durationSeconds),
    },
  };
}

export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absolute(item.path),
    })),
  };
}

export function collectionPageSchema({
  name,
  description,
  path,
  episodes,
}: {
  name: string;
  description: string;
  path: string;
  episodes: { slug: string; title: string }[];
}) {
  return {
    "@type": "CollectionPage",
    "@id": `${absolute(path)}#collection`,
    url: absolute(path),
    name,
    description,
    isPartOf: { "@id": WEBSITE_ID },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: episodes.length,
      itemListElement: episodes.map((episode, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: absolute(`/episodes/${episode.slug}`),
        name: episode.title,
      })),
    },
  };
}

/** Describes the coaching/training offer for the collaboration page. */
export function professionalServiceSchema(services: { name: string; description: string }[]) {
  return {
    "@type": "ProfessionalService",
    "@id": `${siteConfig.url}/#service`,
    name: `${siteConfig.author.name} — ${siteConfig.author.role}`,
    description: siteConfig.description,
    url: absolute("/collaborate"),
    provider: { "@id": PERSON_ID },
    areaServed: "IR",
    availableLanguage: ["fa", "en"],
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "خدمات همکاری",
      itemListElement: services.map((service) => ({
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: service.name, description: service.description },
      })),
    },
  };
}

export function faqSchema(items: { question: string; answer: string }[]) {
  return {
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

/** `3725` -> `"PT1H2M5S"`, the format schema.org and Google expect. */
export function isoDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `PT${h > 0 ? `${h}H` : ""}${m > 0 ? `${m}M` : ""}${s > 0 || (h === 0 && m === 0) ? `${s}S` : ""}`;
}

/** Wraps nodes in a single @graph so one script tag describes the whole page. */
export function graph(...nodes: object[]) {
  return { "@context": "https://schema.org", "@graph": nodes };
}
