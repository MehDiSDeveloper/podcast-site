import { siteConfig } from "@/config/site";

/**
 * Cover art resolution, in one place.
 *
 * Every cover is a square JPG/PNG (`image`, what podcast apps show) plus an
 * optional animated version (`video`: MP4, WebM or GIF) that only the site
 * plays. An episode without its own image uses the show's cover; a show
 * without one uses the generated artwork.
 */

export type Cover = { image: string; video: string | null };

type CoverColumns = { coverImage?: string | null; coverVideo?: string | null };

export function showCover(show: CoverColumns | null | undefined): Cover {
  return { image: show?.coverImage || siteConfig.podcast.artwork, video: show?.coverVideo || null };
}

export function episodeCover(episode: CoverColumns, show: Cover): Cover {
  if (episode.coverImage) return { image: episode.coverImage, video: episode.coverVideo || null };
  // Without its own image an episode borrows the show's, animation included,
  // unless it has an animation of its own.
  return { image: show.image, video: episode.coverVideo || show.video };
}

/** GIFs play in an <img>; MP4 and WebM need a <video>. */
export function isGif(url: string): boolean {
  return /\.gif(\?|$)/i.test(url);
}
