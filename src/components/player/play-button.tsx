"use client";

import { Pause, Play } from "lucide-react";

import { usePlayer, type PlayerTrack } from "@/components/player/player-provider";
import { cn, formatDurationLabel } from "@/lib/utils";

/**
 * The play affordance used on cards and episode pages. It talks to the shared
 * player rather than owning an <audio> element, so starting an episode from
 * anywhere hands off to the same persistent bar.
 */
export function PlayButton({
  track,
  variant = "icon",
  className,
}: {
  track: PlayerTrack;
  variant?: "icon" | "full";
  className?: string;
}) {
  const player = usePlayer();
  const isCurrent = player.isCurrent(track.id);
  const isPlaying = isCurrent && player.isPlaying;

  const label = isPlaying ? `توقف «${track.title}»` : `پخش «${track.title}»`;

  if (variant === "full") {
    return (
      <button
        type="button"
        onClick={() => player.toggleTrack(track)}
        aria-label={label}
        className={cn(
          "inline-flex items-center gap-3 rounded-xl bg-brand px-6 text-brand-contrast",
          "h-14 font-bold shadow-subtle transition-transform hover:scale-[1.02] active:scale-[0.99]",
          className,
        )}
      >
        {isPlaying ? (
          <Pause className="size-5 fill-current" aria-hidden="true" />
        ) : (
          <Play className="size-5 translate-x-px fill-current" aria-hidden="true" />
        )}
        <span>{isPlaying ? "در حال پخش" : "پخش اپیزود"}</span>
        <span className="text-sm font-medium opacity-75">{formatDurationLabel(track.durationSeconds)}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => player.toggleTrack(track)}
      aria-label={label}
      title={label}
      className={cn(
        "grid size-12 shrink-0 place-items-center rounded-full transition-all duration-200",
        isCurrent
          ? "bg-brand text-brand-contrast"
          : "bg-brand-soft text-brand-strong hover:bg-brand hover:text-brand-contrast",
        className,
      )}
    >
      {isPlaying ? (
        <Pause className="size-5 fill-current" aria-hidden="true" />
      ) : (
        <Play className="size-5 translate-x-px fill-current" aria-hidden="true" />
      )}
    </button>
  );
}
