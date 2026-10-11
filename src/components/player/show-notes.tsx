"use client";

import { usePlayer, type PlayerTrack } from "@/components/player/player-provider";

/**
 * Show notes whose timestamps (marked up by `linkTimestamps`) start this
 * episode at that moment. One delegated listener, so the HTML stays plain.
 */
export function ShowNotes({ html, track }: { html: string; track: PlayerTrack }) {
  const { playFrom } = usePlayer();

  return (
    <div
      dangerouslySetInnerHTML={{ __html: html }}
      onClick={(event) => {
        const target = (event.target as HTMLElement).closest<HTMLElement>("[data-seek]");
        if (target) playFrom(track, Number(target.dataset.seek));
      }}
    />
  );
}
