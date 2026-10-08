import { siteConfig } from "@/config/site";
import { htmlToText } from "@/lib/sanitize";
import { absoluteUrl as absolute } from "@/lib/seo";
import { formatDuration } from "@/lib/utils";
import { getAllPublishedEpisodes } from "@/server/episodes";
import { db } from "@/server/db";

/**
 * Podcast RSS 2.0 feed.
 *
 * Built to the Apple Podcasts requirements: the itunes namespace declaration,
 * channel-level itunes:author / itunes:category / itunes:explicit / itunes:image
 * and a valid <language>, plus per-item <enclosure> carrying url, byte length
 * and MIME type, an itunes:summary and an HH:MM:SS itunes:duration.
 *
 * Built per request. The image is built without the production database, so a
 * cached feed would start life empty and podcast clients — which poll far more
 * often than the site is edited — would be served that empty feed until it
 * expired. Serialising a few dozen episodes from local SQLite is cheap.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const [episodes, show] = await Promise.all([
    getAllPublishedEpisodes(),
    db.show.findFirst({ where: { isDefault: true } }),
  ]);

  const channelTitle = show?.title ?? siteConfig.name;
  const channelDescription = show?.description ?? siteConfig.description;
  const author = show?.author ?? siteConfig.author.name;
  const ownerName = show?.ownerName ?? siteConfig.podcast.ownerName;
  const ownerEmail = show?.ownerEmail ?? siteConfig.podcast.ownerEmail;
  const language = show?.language ?? siteConfig.podcast.language;
  const category = show?.category ?? siteConfig.podcast.itunesCategory;
  const subcategory = show?.subcategory ?? siteConfig.podcast.itunesSubcategory;
  const explicit = show?.explicit ?? siteConfig.podcast.explicit;
  const artwork = absolute(show?.coverImage ?? siteConfig.podcast.artwork);

  const items = episodes
    .map((episode) => {
      const url = absolute(`/episodes/${episode.slug}`);
      const summary = htmlToText(episode.showNotes) || episode.description;

      return `    <item>
      <title>${escape(episode.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="false">${escape(episode.id)}</guid>
      ${episode.publishedAt ? `<pubDate>${episode.publishedAt.toUTCString()}</pubDate>` : ""}
      <description>${cdata(episode.description)}</description>
      <content:encoded>${cdata(episode.showNotes ?? episode.description)}</content:encoded>
      <enclosure url="${escape(absolute(episode.audioUrl))}" length="${episode.audioSizeBytes}" type="${escape(episode.audioMimeType)}" />
      <itunes:title>${escape(episode.title)}</itunes:title>
      ${episode.subtitle ? `<itunes:subtitle>${escape(episode.subtitle)}</itunes:subtitle>` : ""}
      <itunes:summary>${cdata(summary)}</itunes:summary>
      <itunes:duration>${formatDuration(episode.durationSeconds)}</itunes:duration>
      <itunes:explicit>${episode.explicit ? "true" : "false"}</itunes:explicit>
      <itunes:episodeType>${escape(episode.episodeType)}</itunes:episodeType>
      ${episode.episodeNumber ? `<itunes:episode>${episode.episodeNumber}</itunes:episode>` : ""}
      ${episode.seasonNumber ? `<itunes:season>${episode.seasonNumber}</itunes:season>` : ""}
      ${episode.coverImage ? `<itunes:image href="${escape(absolute(episode.coverImage))}" />` : ""}
      ${[episode.category?.name, ...episode.tags.map((link) => link.tag.name)]
        .filter((name): name is string => Boolean(name))
        .map((name) => `<category>${escape(name)}</category>`)
        .join("\n      ")}
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom" version="2.0">
  <channel>
    <title>${escape(channelTitle)}</title>
    <link>${siteConfig.url}</link>
    <description>${cdata(channelDescription)}</description>
    <language>${escape(language)}</language>
    <copyright>${escape(show?.copyright ?? siteConfig.podcast.copyright)}</copyright>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${absolute("/feed.xml")}" rel="self" type="application/rss+xml" />
    <itunes:author>${escape(author)}</itunes:author>
    <itunes:summary>${cdata(channelDescription)}</itunes:summary>
    ${show?.subtitle ? `<itunes:subtitle>${escape(show.subtitle)}</itunes:subtitle>` : ""}
    <itunes:owner>
      <itunes:name>${escape(ownerName)}</itunes:name>
      <itunes:email>${escape(ownerEmail)}</itunes:email>
    </itunes:owner>
    <itunes:image href="${escape(artwork)}" />
    <itunes:category text="${escape(category)}">${
      subcategory ? `\n      <itunes:category text="${escape(subcategory)}" />\n    ` : ""
    }</itunes:category>
    <itunes:explicit>${explicit ? "true" : "false"}</itunes:explicit>
    <itunes:type>episodic</itunes:type>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}

function escape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** CDATA keeps show-note markup intact; `]]>` is split so it cannot close early. */
function cdata(value: string): string {
  return `<![CDATA[${value.replace(/]]>/g, "]]]]><![CDATA[>")}]]>`;
}
