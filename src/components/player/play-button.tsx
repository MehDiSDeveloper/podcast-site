"use client";

import { Pause, Play, RotateCcw } from "lucide-react";

import {
  isFinished,
  resumePoint,
  usePlayer,
  useSavedPosition,
  type PlayerTrack,
} from "@/components/player/player-provider";
import { cn, formatDurationLabel } from "@/lib/utils";

/**
 * The play affordance used on cards and episode pages. It talks to the shared
 * player rather than owning an <audio> element, so starting an episode from
 * anywhere hands off to the same persistent bar.
 *
 * It also shows how much of the episode this browser has heard: a ring around
 * the icon button, a bar along the bottom of the full one, and «ادامه» instead
 * of «پخش» when there is a point to pick up from.
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
  const saved = useSavedPosition(track.id);
  const isCurrent = player.isCurrent(track.id);
  const isPlaying = isCurrent && player.isPlaying;
  const isLoading = isCurrent && player.isLoading;

  const duration = (isCurrent && player.duration) || track.durationSeconds;
  const position = isCurrent ? player.currentTime : saved;
  // The loaded track counts as heard only once it has actually reached the end.
  const finished = isCurrent
    ? !isPlaying && duration > 0 && position >= duration - 1
    : isFinished(saved, duration);
  const continuing = !finished && (isCurrent ? position > 0 : resumePoint(saved, duration) > 0);
  const progress = duration > 0 ? Math.min(position / duration, 1) : 0;

  const label = isPlaying
    ? `توقف «${track.title}»`
    : `${continuing ? "ادامه‌ی" : "پخش"} «${track.title}»${finished ? "، شنیده‌شده" : ""}`;

  const icon = isLoading ? (
    <span className="size-5 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
  ) : isPlaying ? (
    <Pause className="size-5 fill-current" aria-hidden="true" />
  ) : finished ? (
    <RotateCcw className="size-5" aria-hidden="true" />
  ) : (
    <Play className="size-5 translate-x-px fill-current" aria-hidden="true" />
  );

  if (variant === "full") {
    const caption = isPlaying
      ? "در حال پخش"
      : finished
        ? "پخش دوباره"
        : continuing
          ? "ادامه‌ی پخش"
          : "پخش اپیزود";
    const detail =
      continuing || (isPlaying && position > 0)
        ? `${formatDurationLabel(duration - position)} مانده`
        : formatDurationLabel(track.durationSeconds);

    return (
      <button
        type="button"
        onClick={() => player.toggleTrack(track)}
        aria-label={label}
        className={cn(
          "magnetic sheen glow-brand relative inline-flex items-center gap-3 overflow-hidden rounded-xl bg-brand px-6 text-brand-contrast",
          "h-14 font-bold transition-[transform,box-shadow] hover:scale-[1.02] active:scale-[0.99]",
          className,
        )}
      >
        {icon}
        <span>{caption}</span>
        <span className="text-sm font-medium opacity-75">{detail}</span>
        {progress > 0 && !finished ? (
          <span className="absolute inset-x-0 bottom-0 h-1 bg-brand-contrast/25" aria-hidden="true">
            <span className="block h-full bg-brand-contrast/80 transition-[width]" style={{ width: `${progress * 100}%` }} />
          </span>
        ) : null}
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
        "magnetic relative grid size-12 shrink-0 place-items-center rounded-full transition-all duration-200",
        isCurrent
          ? "glow-brand bg-brand text-brand-contrast"
          : "bg-brand-soft text-brand-strong hover:bg-brand hover:text-brand-contrast",
        className,
      )}
    >
      {icon}
      {progress > 0 ? (
        // Starts at 12 o'clock and runs clockwise, like every progress ring.
        <svg viewBox="0 0 48 48" className="pointer-events-none absolute inset-0 size-full -rotate-90" aria-hidden="true">
          <circle
            cx="24"
            cy="24"
            r="22.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            pathLength={100}
            strokeDasharray={`${progress * 100} 100`}
            className={cn("transition-[stroke-dasharray]", isCurrent ? "opacity-70" : "opacity-90")}
          />
        </svg>
      ) : null}
    </button>
  );
}
