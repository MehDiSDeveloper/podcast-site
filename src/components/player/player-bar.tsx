"use client";

import { Pause, Play, RotateCcw, RotateCw, Volume2, VolumeX, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

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

  return (
    <div
      className={cn(
        "player-bar-active fixed inset-x-0 bottom-0 z-50 border-t border-line bg-canvas/92 shadow-player backdrop-blur-xl",
        // The bar only mounts once a track is chosen, so a CSS entry animation is enough.
        "animate-[player-in_500ms_var(--ease-out-soft)]",
      )}
      role="region"
      aria-label="پخش‌کننده‌ی پادکست"
    >
      {/* Scrub bar sits on the top edge, full width, thin until hovered. */}
      <div className="group/scrub absolute inset-x-0 -top-2 h-4">
        <div className="pointer-events-none absolute inset-x-0 top-2 h-1 bg-line">
          <div className="h-full bg-line-strong transition-[width]" style={{ width: `${buffered}%` }} />
          <div
            className="absolute inset-y-0 right-0 bg-brand transition-[width] duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
        <input
          type="range"
          min={0}
          max={Math.max(duration, 1)}
          step={1}
          value={displayTime}
          onChange={(event) => setScrubbing(Number(event.target.value))}
          onPointerUp={() => {
            if (scrubbing !== null) player.seekTo(scrubbing);
            setScrubbing(null);
          }}
          onKeyUp={() => {
            if (scrubbing !== null) player.seekTo(scrubbing);
            setScrubbing(null);
          }}
          onBlur={() => {
            if (scrubbing !== null) player.seekTo(scrubbing);
            setScrubbing(null);
          }}
          aria-label="جابه‌جایی در اپیزود"
          aria-valuetext={`${formatClock(displayTime)} از ${formatClock(duration)}`}
          className="player-scrub absolute inset-0 w-full cursor-pointer"
        />
      </div>

      <div className="container-page flex h-20 items-center gap-3 md:gap-5">
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
              <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M5 10v4M9.5 6.5v11M14.5 8.5v7M19 10.5v3" />
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
              <p className="mt-0.5 text-xs text-danger">{player.error}</p>
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
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => player.skipBy(-15)}
            aria-label="۱۵ ثانیه به عقب"
            title="۱۵ ثانیه به عقب"
            className="hidden size-10 place-items-center rounded-lg text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink sm:grid"
          >
            <RotateCcw className="size-5" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={player.togglePlay}
            aria-label={player.isPlaying ? "توقف" : "پخش"}
            className="grid size-12 place-items-center rounded-full bg-brand text-brand-contrast transition-transform hover:scale-105 active:scale-95"
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

          <button
            type="button"
            onClick={() => player.skipBy(30)}
            aria-label="۳۰ ثانیه به جلو"
            title="۳۰ ثانیه به جلو"
            className="hidden size-10 place-items-center rounded-lg text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink sm:grid"
          >
            <RotateCw className="size-5" aria-hidden="true" />
          </button>
        </div>

        {/* Secondary controls */}
        <div className="flex flex-1 items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => {
              const index = PLAYBACK_RATES.indexOf(player.playbackRate as (typeof PLAYBACK_RATES)[number]);
              player.setPlaybackRate(PLAYBACK_RATES[(index + 1) % PLAYBACK_RATES.length]);
            }}
            aria-label={`سرعت پخش: ${toFaDigits(player.playbackRate)} برابر. برای تغییر کلیک کنید.`}
            title="سرعت پخش"
            className="nums hidden h-9 min-w-12 items-center justify-center rounded-lg px-2 text-sm font-bold text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink lg:flex"
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
