import { z } from "zod";

import { COLLABORATION_TYPES } from "@/lib/enums";

/**
 * Contact form schema. Shared by the server action (authoritative) and the
 * client (instant feedback), so the two can never disagree about what's valid.
 */

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, { message: `حداکثر ${max} نویسه مجاز است.` })
    .optional()
    .transform((value) => (value ? value : undefined));

export const inquirySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: "لطفاً نام خود را وارد کنید." })
    .max(120, { message: "نام بیش از حد طولانی است." }),

  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, { message: "ایمیل لازم است تا بتوانم پاسخ بدهم." })
    .email({ message: "ایمیل واردشده معتبر نیست." })
    .max(200),

  phone: z
    .string()
    .trim()
    .max(30)
    .optional()
    .transform((value) => (value ? value : undefined))
    .refine((value) => !value || /^[+\d\s()\-۰-۹]{7,30}$/.test(value), {
      message: "شماره‌ی تماس معتبر نیست.",
    }),

  company: optionalText(160),
  roleTitle: optionalText(120),

  collaborationType: z.enum(COLLABORATION_TYPES, {
    message: "لطفاً نوع همکاری را انتخاب کنید.",
  }),

  teamSize: optionalText(40),
  timeline: optionalText(60),

  message: z
    .string()
    .trim()
    .min(20, { message: "لطفاً کمی بیشتر توضیح دهید (دست‌کم ۲۰ نویسه)." })
    .max(5000, { message: "پیام بیش از حد طولانی است." }),

  consent: z.literal("on", { message: "برای ارسال، موافقت با شرایط لازم است." }),
});

export type InquiryInput = z.infer<typeof inquirySchema>;

export type InquiryFormState =
  | { status: "idle" }
  | { status: "success" }
  | {
      status: "error";
      message: string;
      fieldErrors?: Partial<Record<keyof InquiryInput, string>>;
      /** Echoed back so a failed submit does not wipe what the visitor typed. */
      values?: Record<string, string>;
    };
