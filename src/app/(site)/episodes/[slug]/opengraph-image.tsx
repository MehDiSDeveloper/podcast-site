import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/og";
import { formatDurationLabel, toFaDigits } from "@/lib/utils";
import { getEpisodeBySlug } from "@/server/episodes";
import { siteConfig } from "@/config/site";

export const alt = "تصویر اپیزود";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const episode = await getEpisodeBySlug(slug);

  if (!episode) {
    return renderOgImage({ title: siteConfig.tagline, eyebrow: "پادکست" });
  }

  return renderOgImage({
    title: episode.title,
    eyebrow: episode.episodeNumber ? `اپیزود ${toFaDigits(episode.episodeNumber)}` : "اپیزود",
    meta: formatDurationLabel(episode.durationSeconds),
  });
}
