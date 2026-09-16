import { Clock } from "lucide-react";
import Link from "next/link";

import { PlayButton } from "@/components/player/play-button";
import { toPlayerTrack, type EpisodeListItem } from "@/server/episodes";
import { cn, formatDate, formatDurationLabel, toFaDigits, toISODate } from "@/lib/utils";

/**
 * One episode, in card or row form.
 *
 * The whole card is a link to the episode page, with the play button layered
 * above it — so a click anywhere reads the show notes, but the visitor can
 * start listening without leaving the list.
 */
export function EpisodeCard({
  episode,
  layout = "card",
  className,
}: {
  episode: EpisodeListItem;
  layout?: "card" | "row";
  className?: string;
}) {
  const track = toPlayerTrack(episode);
  const topics = episode.topics.map((link) => link.topic);

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
          "group relative flex items-start gap-4 rounded-xl border border-line bg-surface p-4 transition-all duration-300",
          "hover:border-line-strong hover:shadow-card sm:gap-5 sm:p-5",
          className,
        )}
      >
        <PlayButton track={track} className="relative z-10 mt-0.5" />
        <div className="min-w-0 flex-1">
          {meta}
          <h3 className="mt-2 text-lg font-bold leading-snug">
            <Link href={`/episodes/${episode.slug}`} className="after:absolute after:inset-0">
              {episode.title}
            </Link>
          </h3>
          <p className="mt-2 line-clamp-2 text-sm leading-loose text-ink-muted">{episode.description}</p>
          <TopicList topics={topics} />
        </div>
      </article>
    );
  }

  return (
    <article
      className={cn(
        "group relative flex flex-col rounded-2xl border border-line bg-surface p-6 transition-all duration-300",
        "hover:-translate-y-1 hover:border-line-strong hover:shadow-lifted",
        className,
      )}
    >
      {meta}
      <h3 className="mt-3 text-xl font-bold leading-snug">
        <Link href={`/episodes/${episode.slug}`} className="after:absolute after:inset-0">
          {episode.title}
        </Link>
      </h3>
      {episode.subtitle ? <p className="mt-1.5 text-sm text-ink-subtle">{episode.subtitle}</p> : null}
      <p className="mt-3 line-clamp-3 flex-1 text-sm leading-loose text-ink-muted">{episode.description}</p>

      <div className="mt-5 flex items-center justify-between gap-3">
        <TopicList topics={topics} className="mt-0" />
        <PlayButton track={track} className="relative z-10 size-11" />
      </div>
    </article>
  );
}

function TopicList({
  topics,
  className,
}: {
  topics: { slug: string; name: string }[];
  className?: string;
}) {
  if (topics.length === 0) return null;

  return (
    <ul className={cn("mt-3 flex flex-wrap gap-1.5", className)}>
      {topics.slice(0, 2).map((topic) => (
        <li key={topic.slug}>
          {/* Relative + z-10 lifts these above the card's full-area link. */}
          <Link
            href={`/topics/${topic.slug}`}
            className="relative z-10 inline-block rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium text-ink-muted transition-colors hover:bg-brand-soft hover:text-brand-strong"
          >
            {topic.name}
          </Link>
        </li>
      ))}
    </ul>
  );
}
