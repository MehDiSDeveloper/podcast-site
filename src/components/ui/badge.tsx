import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type Tone = "neutral" | "brand" | "accent" | "success" | "warning" | "danger";

const tones: Record<Tone, string> = {
  neutral: "bg-surface-2 text-ink-muted",
  brand: "bg-brand-soft text-brand-strong",
  accent: "bg-accent-soft text-accent-contrast",
  success: "bg-success/12 text-success",
  warning: "bg-warning/15 text-warning",
  danger: "bg-danger-soft text-danger",
};

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold leading-none",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
