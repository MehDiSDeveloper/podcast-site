"use client";

import { useEffect, useRef } from "react";

import { isGif, type Cover } from "@/lib/cover";
import { cn } from "@/lib/utils";

/**
 * A cover, animated when it has an animated version. The video is muted and
 * looped like a GIF, and only starts when the visitor has not asked for
 * reduced motion; until then (and without JS) its poster is the still image.
 */
export function CoverArt({ cover, alt, className }: { cover: Cover; alt: string; className?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const classes = cn("aspect-square w-full bg-surface-2 object-cover", className);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    video.play().catch(() => undefined);
  }, [cover.video]);

  if (cover.video && isGif(cover.video)) {
    return (
      // `contents` makes the <img> the layout box, so `className` (order, size) still applies.
      <picture className="contents">
        <source media="(prefers-reduced-motion: reduce)" srcSet={cover.image} />
        <img src={cover.video} alt={alt} className={classes} />
      </picture>
    );
  }

  if (cover.video) {
    return (
      <video
        ref={videoRef}
        src={cover.video}
        poster={cover.image}
        muted
        loop
        playsInline
        preload="metadata"
        aria-label={alt}
        className={classes}
      />
    );
  }

  // eslint-disable-next-line @next/next/no-img-element -- uploaded covers are served as-is
  return <img src={cover.image} alt={alt} className={classes} />;
}
