import { Badge } from "@/components/ui/badge";
import {
  EPISODE_STATUS_LABELS,
  INQUIRY_STATUS_LABELS,
  type EpisodeStatus,
  type InquiryStatus,
} from "@/lib/enums";

const inquiryTones = {
  NEW: "accent",
  READ: "neutral",
  REPLIED: "success",
  ARCHIVED: "neutral",
} as const;

export function InquiryStatusBadge({ status }: { status: string }) {
  const key = status as InquiryStatus;
  return <Badge tone={inquiryTones[key] ?? "neutral"}>{INQUIRY_STATUS_LABELS[key] ?? status}</Badge>;
}

const episodeTones = {
  DRAFT: "neutral",
  SCHEDULED: "warning",
  PUBLISHED: "success",
} as const;

/**
 * `isFuture` comes from the data layer: a PUBLISHED episode dated in the future
 * is not live yet, so the badge shows it as scheduled — what visitors see.
 */
export function EpisodeStatusBadge({ status, isFuture }: { status: string; isFuture: boolean }) {
  const effective: EpisodeStatus = status === "PUBLISHED" && isFuture ? "SCHEDULED" : (status as EpisodeStatus);

  return (
    <Badge tone={episodeTones[effective] ?? "neutral"}>{EPISODE_STATUS_LABELS[effective] ?? status}</Badge>
  );
}
