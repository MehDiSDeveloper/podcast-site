"use client";

import { Pause, Play, RotateCcw, RotateCw, Volume2, VolumeX, X } from "lucide-react";
import Link from "next/link";
import { useState, type ReactNode } from "react";

import { PLAYBACK_RATES, usePlayer } from "@/components/player/player-provider";
import { cn, formatClock, toFaDigits } from "@/lib/utils";

export function PlayerBar() {
  const player = usePlayer();
  const [scrubbing, setScrubbing] = useState<number | null>(null);

  if (!player.track) return null;

  const duration = player.duration || player.track.durationSeconds || 0;
  const displayTime = scrubbing ?? player.currentTime;
  const progress = duration > 0 ? (displayTime / duration) * 100 : 0;
  const buffered = duration > 0 ? (player.bufferedTo / duration) * 100 : 0;

  const commitScrub = () => {
    if (scrubbing !== null) player.seekTo(scrubbing);
    setScrubbing(null);
  };

  return (
    <div
      className={cn(
        "player-bar-active fixed inset-x-0 bottom-0 z-50 glass-bar border-t border-line shadow-player",
        // The bar only mounts once a track is chosen, so a CSS entry animation is enough.
        "animate-[player-in_500ms_var(--ease-out-soft)]",
      )}
      role="region"
      aria-label="پخش‌کننده‌ی پادکست"
    >
      {/* Scrub bar on the top edge, full width. The hit area is taller than the line. */}
      <div className="group/scrub absolute inset-x-0 -top-3 h-6" data-scrubbing={scrubbing !== null || undefined}>
        <div className="pointer-events-none absolute inset-x-0 top-3 h-1 bg-line transition-[height,top] group-hover/scrub:top-[0.6875rem] group-hover/scrub:h-1.5 group-data-[scrubbing]/scrub:top-[0.6875rem] group-data-[scrubbing]/scrub:h-1.5">
          <div className="absolute inset-y-0 right-0 bg-line-strong" style={{ width: `${buffered}%` }} />
          <div
            className={cn("absolute inset-y-0 right-0 bg-brand", scrubbing === null && "transition-[width] duration-200")}
            style={{ width: `${progress}%` }}
          />
        </div>
        {scrubbing !== null ? (
          // The time under the thumb, so a long drag lands where the listener means.
          <span
            className="nums pointer-events-none absolute bottom-full mb-1 -translate-x-1/2 rounded-md bg-ink px-2 py-0.5 text-xs font-bold text-ink-inverse shadow-lifted"
            style={{ left: `clamp(1.5rem, ${100 - progress}%, calc(100% - 1.5rem))` }}
            dir="ltr"
          >
            {formatClock(scrubbing)}
          </span>
        ) : null}
        <input
          type="range"
          min={0}
          max={Math.max(duration, 1)}
          step={1}
          value={displayTime}
          onChange={(event) => setScrubbing(Number(event.target.value))}
          onPointerUp={commitScrub}
          onKeyUp={commitScrub}
          onBlur={commitScrub}
          aria-label="جابه‌جایی در اپیزود"
          aria-valuetext={`${formatClock(displayTime)} از ${formatClock(duration)}`}
          className="player-scrub absolute inset-0 w-full cursor-pointer"
        />
      </div>

      <div className="container-page flex h-20 items-center gap-2 sm:gap-4 md:gap-5">
        {/* Episode identity */}
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div
            aria-hidden="true"
            className="hidden size-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-brand-soft text-brand-strong sm:grid"
          >
            {player.track.coverImage ? (
              // eslint-disable-next-line @next/next/no-img-element -- cover URLs are arbitrary remote hosts
              <img src={player.track.coverImage} alt="" className="size-full object-cover" />
            ) : (
              <svg
                viewBox="0 0 24 24"
                className="size-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                data-playing={player.isPlaying}
              >
                <path className="eq-bar" d="M5 10v4" />
                <path className="eq-bar" d="M9.5 6.5v11" />
                <path className="eq-bar" d="M14.5 8.5v7" />
                <path className="eq-bar" d="M19 10.5v3" />
              </svg>
            )}
          </div>

          <div className="min-w-0">
            <Link
              href={`/episodes/${player.track.slug}`}
              className="block truncate text-sm font-bold transition-colors hover:text-brand-strong"
            >
              {player.track.title}
            </Link>
            {player.error ? (
              <p className="mt-0.5 truncate text-xs text-danger">{player.error}</p>
            ) : (
              // A clock reads left-to-right even in Persian, hence the isolated LTR run.
              <p className="nums mt-0.5 text-xs text-ink-subtle" dir="ltr">
                <span className="inline-block text-right">
                  {formatClock(displayTime)} / {formatClock(duration)}
                </span>
              </p>
            )}
          </div>
        </div>

        {/* Transport */}
        <div className="flex items-center gap-0.5 sm:gap-1">
          <SkipButton seconds={-15} onClick={() => player.skipBy(-15)}>
            <RotateCcw className="size-[1.375rem]" strokeWidth={1.75} aria-hidden="true" />
          </SkipButton>

          <button
            type="button"
            onClick={player.togglePlay}
            aria-label={player.error ? "تلاش دوباره" : player.isPlaying ? "توقف" : "پخش"}
            className="glow-brand grid size-12 place-items-center rounded-full bg-brand text-brand-contrast transition-transform hover:scale-105 active:scale-95"
          >
            {player.isLoading ? (
              <span
                className="size-5 animate-spin rounded-full border-2 border-current border-t-transparent"
                aria-hidden="true"
              />
            ) : player.isPlaying ? (
              <Pause className="size-5 fill-current" aria-hidden="true" />
            ) : (
              <Play className="size-5 translate-x-px fill-current" aria-hidden="true" />
            )}
          </button>

          <SkipButton seconds={30} onClick={() => player.skipBy(30)}>
            <RotateCw className="size-[1.375rem]" strokeWidth={1.75} aria-hidden="true" />
          </SkipButton>
        </div>

        {/* Secondary controls. Only stretches once there is room, so phones keep the title wide. */}
        <div className="flex items-center justify-end gap-1 sm:flex-1">
          <button
            type="button"
            onClick={() => {
              const index = PLAYBACK_RATES.indexOf(player.playbackRate as (typeof PLAYBACK_RATES)[number]);
              player.setPlaybackRate(PLAYBACK_RATES[(index + 1) % PLAYBACK_RATES.length]);
            }}
            aria-label={`سرعت پخش: ${toFaDigits(player.playbackRate)} برابر. برای تغییر کلیک کنید.`}
            title="سرعت پخش"
            className={cn(
              "nums hidden h-9 min-w-12 items-center justify-center rounded-lg px-2 text-sm font-bold transition-colors hover:bg-surface-2 sm:flex",
              player.playbackRate === 1 ? "text-ink-muted hover:text-ink" : "bg-brand-soft text-brand-strong",
            )}
          >
            {toFaDigits(player.playbackRate)}×
          </button>

          <div className="hidden items-center gap-2 lg:flex">
            <button
              type="button"
              onClick={player.toggleMute}
              aria-label={player.isMuted ? "باصدا کردن" : "بی‌صدا کردن"}
              className="grid size-9 place-items-center rounded-lg text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
            >
              {player.isMuted || player.volume === 0 ? (
                <VolumeX className="size-5" aria-hidden="true" />
              ) : (
                <Volume2 className="size-5" aria-hidden="true" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={player.isMuted ? 0 : player.volume}
              onChange={(event) => player.setVolume(Number(event.target.value))}
              aria-label="بلندی صدا"
              className="player-volume w-20 cursor-pointer"
            />
          </div>

          <button
            type="button"
            onClick={player.close}
            aria-label="بستن پخش‌کننده"
            title="بستن پخش‌کننده"
            className="grid size-9 place-items-center rounded-lg text-ink-subtle transition-colors hover:bg-surface-2 hover:text-ink"
          >
            <X className="size-4.5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}

/** A rotate arrow with the number of seconds written inside it. */
function SkipButton({ seconds, onClick, children }: { seconds: number; onClick: () => void; children: ReactNode }) {
  const label = `${toFaDigits(Math.abs(seconds))} ثانیه ${seconds < 0 ? "به عقب" : "به جلو"}`;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="relative grid size-10 place-items-center rounded-full text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
    >
      {children}
      <span className="nums absolute inset-0 grid place-items-center pt-px text-[0.5625rem] font-bold" aria-hidden="true">
        {toFaDigits(Math.abs(seconds))}
      </span>
    </button>
  );
}
