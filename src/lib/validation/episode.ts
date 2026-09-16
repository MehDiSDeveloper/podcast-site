import { z } from "zod";

import { EPISODE_STATUSES, EPISODE_TYPES } from "@/lib/enums";

/** Empty form strings become undefined so optional columns are stored as null. */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, { message: `حداکثر ${max} نویسه مجاز است.` })
    .optional()
    .transform((value) => value || undefined);

const optionalInt = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? Number(value) : undefined))
  .refine((value) => value === undefined || (Number.isInteger(value) && value > 0), {
    message: "یک عدد صحیح مثبت وارد کنید.",
  });

const mediaUrl = (message: string) =>
  z
    .string()
    .trim()
    .refine((value) => !value || value.startsWith("/uploads/") || /^https?:\/\/\S+$/.test(value), { message });

export const episodeSchema = z
  .object({
    title: z.string().trim().min(3, { message: "عنوان دست‌کم سه نویسه باشد." }).max(200),
    slug: optionalText(120),
    subtitle: optionalText(200),
    description: z
      .string()
      .trim()
      .min(20, { message: "خلاصه دست‌کم ۲۰ نویسه باشد." })
      .max(1000, { message: "خلاصه حداکثر ۱۰۰۰ نویسه باشد." }),
    showNotes: optionalText(100_000),
    transcript: optionalText(500_000),

    audioUrl: mediaUrl("آدرس فایل صوتی معتبر نیست.").pipe(
      z.string().min(1, { message: "فایل صوتی را بارگذاری کنید یا آدرس آن را وارد کنید." }),
    ),
    audioSizeBytes: z.coerce.number().int().min(0).catch(0),
    audioMimeType: z.string().trim().min(1).catch("audio/mpeg"),
    durationSeconds: z.coerce.number().int().min(1, { message: "مدت اپیزود را وارد کنید." }).catch(0),
    coverImage: mediaUrl("آدرس تصویر معتبر نیست.").transform((value) => value || undefined),

    episodeNumber: optionalInt,
    seasonNumber: optionalInt,
    episodeType: z.enum(EPISODE_TYPES),
    status: z.enum(EPISODE_STATUSES),
    publishedAt: z
      .string()
      .optional()
      .transform((value) => (value ? new Date(value) : undefined))
      .refine((value) => value === undefined || !Number.isNaN(value.getTime()), { message: "تاریخ معتبر نیست." }),

    featured: z.string().optional().transform((value) => value === "on"),
    explicit: z.string().optional().transform((value) => value === "on"),
    topicIds: z.array(z.string()).default([]),

    seoTitle: optionalText(120),
    seoDescription: optionalText(300),
  })
  .superRefine((data, ctx) => {
    // .catch(0) above keeps the type numeric; report the real problem here.
    if (data.durationSeconds < 1) {
      ctx.addIssue({ code: "custom", path: ["durationSeconds"], message: "مدت اپیزود را وارد کنید." });
    }
    if (data.status === "SCHEDULED" && !data.publishedAt) {
      ctx.addIssue({ code: "custom", path: ["publishedAt"], message: "برای زمان‌بندی، تاریخ انتشار لازم است." });
    }
  });

export type EpisodeInput = z.infer<typeof episodeSchema>;

export type FormState<Field extends string = string> =
  | { status: "idle" }
  | { status: "success"; message: string }
  | { status: "error"; message: string; fieldErrors?: Partial<Record<Field, string>> };

/** Collapses zod issues into one message per field for inline display. */
export function toFieldErrors<Field extends string>(issues: z.core.$ZodIssue[]) {
  const errors: Partial<Record<Field, string>> = {};
  for (const issue of issues) {
    const key = String(issue.path[0]) as Field;
    errors[key] ??= issue.message;
  }
  return errors;
}
