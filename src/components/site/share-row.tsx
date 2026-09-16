"use client";

import { Check, Link2, Share2 } from "lucide-react";
import { useEffect, useState } from "react";

import { useClientValue } from "@/lib/use-client-value";
import { cn } from "@/lib/utils";

/**
 * Share controls. Uses the native share sheet where the browser offers one
 * (most mobile browsers) and falls back to explicit network links elsewhere.
 */
export function ShareRow({
  url,
  title,
  className,
}: {
  url: string;
  title: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const canShare = useClientValue(() => "share" in navigator, false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      // Clipboard access can be denied; the visible links still work.
    }
  }

  const targets = [
    { label: "تلگرام", href: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}` },
    { label: "واتساپ", href: `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}` },
    { label: "لینکدین", href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}` },
    { label: "ایکس", href: `https://x.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}` },
  ];

  return (
    <div className={cn("flex flex-wrap items-center gap-2 border-t border-line pt-8", className)}>
      <span className="ml-2 text-sm font-semibold text-ink">هم‌رسانی:</span>

      {canShare ? (
        <button type="button" onClick={() => void navigator.share({ title, url })} className={chip}>
          <Share2 className="size-4" aria-hidden="true" />
          اشتراک‌گذاری
        </button>
      ) : null}

      {targets.map((target) => (
        <a key={target.label} href={target.href} target="_blank" rel="noopener noreferrer" className={chip}>
          {target.label}
        </a>
      ))}

      <button type="button" onClick={copy} className={chip} aria-live="polite">
        {copied ? (
          <>
            <Check className="size-4 text-success" aria-hidden="true" />
            کپی شد
          </>
        ) : (
          <>
            <Link2 className="size-4" aria-hidden="true" />
            کپی لینک
          </>
        )}
      </button>
    </div>
  );
}

const chip =
  "inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 py-2 text-sm " +
  "font-medium text-ink-muted transition-colors hover:border-line-strong hover:text-ink";
