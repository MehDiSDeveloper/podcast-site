import { Clock } from "lucide-react";
import Link from "next/link";

import { PlayButton } from "@/components/player/play-button";
import { episodeCover } from "@/lib/cover";
import { cn, formatDate, formatDurationLabel, toFaDigits, toISODate } from "@/lib/utils";
import { toPlayerTrack, type EpisodeListItem } from "@/server/episodes";
import { getShowCover } from "@/server/show";

/**
 * One episode, in card or row form.
 *
 * The whole card is a link to the episode page, with the play button layered
 * above it — so a click anywhere reads the show notes, but the visitor can
 * start listening without leaving the list. Lists show the still cover only;
 * the animated one plays on the episode page.
 */
export async function EpisodeCard({
  episode,
  layout = "card",
  className,
}: {
  episode: EpisodeListItem;
  layout?: "card" | "row";
  className?: string;
}) {
  const cover = episodeCover(episode, await getShowCover());
  const track = toPlayerTrack(episode, cover);

  const thumbnail = (
    // eslint-disable-next-line @next/next/no-img-element -- uploaded covers are served as-is
    <img
      src={cover.image}
      alt=""
      loading="lazy"
      className="aspect-square size-16 shrink-0 rounded-xl bg-surface-2 object-cover sm:size-20"
    />
  );

  const meta = (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-ink-subtle">
      {episode.episodeNumber ? (
        <span className="nums font-semibold text-brand-strong">اپیزود {toFaDigits(episode.episodeNumber)}</span>
      ) : null}
      {episode.publishedAt ? (
        <time dateTime={toISODate(episode.publishedAt)}>{formatDate(episode.publishedAt)}</time>
      ) : null}
      <span className="inline-flex items-center gap-1">
        <Clock className="size-3.5" aria-hidden="true" />
        {formatDurationLabel(episode.durationSeconds)}
      </span>
    </div>
  );

  if (layout === "row") {
    return (
      <article
        className={cn(
          "glass spotlight group relative flex items-start gap-4 rounded-xl p-4 transition-all duration-300",
          "hover:-translate-y-0.5 sm:gap-5 sm:p-5",
          className,
        )}
      >
        {thumbnail}
        <div className="min-w-0 flex-1">
          {meta}
          <h3 className="mt-2 text-lg font-bold leading-snug">
            <Link href={`/episodes/${episode.slug}`} className="after:absolute after:inset-0">
              {episode.title}
            </Link>
          </h3>
          <p className="mt-2 line-clamp-2 text-sm leading-loose text-ink-muted">{episode.description}</p>
          <CategoryLink category={episode.category} className="mt-3" />
        </div>
        <PlayButton track={track} className="relative z-10 self-center" />
      </article>
    );
  }

  return (
    <article
      className={cn(
        "glass spotlight group relative flex flex-col rounded-2xl p-6 transition-all duration-300",
        "hover:-translate-y-1",
        className,
      )}
    >
      <div className="flex items-start gap-4">
        {thumbnail}
        <div className="min-w-0 flex-1">
          {meta}
          <h3 className="mt-2 text-xl font-bold leading-snug">
            <Link href={`/episodes/${episode.slug}`} className="after:absolute after:inset-0">
              {episode.title}
            </Link>
          </h3>
        </div>
      </div>
      {episode.subtitle ? <p className="mt-1.5 text-sm text-ink-subtle">{episode.subtitle}</p> : null}
      <p className="mt-3 line-clamp-3 flex-1 text-sm leading-loose text-ink-muted">{episode.description}</p>

      <div className="mt-5 flex items-center justify-between gap-3">
        <CategoryLink category={episode.category} />
        <PlayButton track={track} className="relative z-10 size-11" />
      </div>
    </article>
  );
}

function CategoryLink({
  category,
  className,
}: {
  category: { slug: string; name: string } | null;
  className?: string;
}) {
  // The empty span keeps the play button pinned to the end of the card footer.
  if (!category) return <span />;

  return (
    // Relative + z-10 lifts the link above the card's full-area link.
    <Link
      href={`/categories/${category.slug}`}
      className={cn(
        "chip-tint relative z-10 inline-block self-start rounded-full px-2.5 py-1 text-xs font-medium transition-colors hover:bg-brand-soft hover:text-brand-strong",
        className,
      )}
    >
      {category.name}
    </Link>
  );
}
