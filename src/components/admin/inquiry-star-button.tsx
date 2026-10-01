"use client";

import { Star } from "lucide-react";
import { useOptimistic, useTransition } from "react";

import { setInquiryStarredAction } from "@/app/(admin)/admin/(panel)/inquiries/actions";
import { cn } from "@/lib/utils";

export function InquiryStarButton({ id, starred, className }: { id: string; starred: boolean; className?: string }) {
  const [optimistic, setOptimistic] = useOptimistic(starred);
  const [, startTransition] = useTransition();

  return (
    <button
      type="button"
      aria-pressed={optimistic}
      aria-label={optimistic ? "برداشتن از محبوب‌ها" : "افزودن به محبوب‌ها"}
      title={optimistic ? "برداشتن از محبوب‌ها" : "افزودن به محبوب‌ها"}
      onClick={() =>
        startTransition(async () => {
          setOptimistic(!optimistic);
          await setInquiryStarredAction(id, !optimistic);
        })
      }
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-full transition-colors hover:bg-surface-2",
        optimistic ? "text-warning" : "text-ink-subtle hover:text-ink",
        className,
      )}
    >
      <Star className="size-5" fill={optimistic ? "currentColor" : "none"} aria-hidden="true" />
    </button>
  );
}
