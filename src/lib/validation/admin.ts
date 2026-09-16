import { z } from "zod";

import { INQUIRY_STATUSES } from "@/lib/enums";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, { message: `حداکثر ${max} نویسه مجاز است.` })
    .optional()
    .transform((value) => value || undefined);

export const topicSchema = z.object({
  name: z.string().trim().min(2, { message: "نام موضوع دست‌کم دو نویسه باشد." }).max(80),
  slug: optionalText(80),
  description: optionalText(200),
  body: optionalText(20_000),
  sortOrder: z.coerce.number().int().min(0).max(9999).catch(0),
  seoTitle: optionalText(120),
  seoDescription: optionalText(300),
});
export type TopicInput = z.infer<typeof topicSchema>;

export const inquiryUpdateSchema = z.object({
  status: z.enum(INQUIRY_STATUSES),
  adminNotes: optionalText(5000),
});
export type InquiryUpdateInput = z.infer<typeof inquiryUpdateSchema>;

export const profileSchema = z.object({
  name: z.string().trim().min(2, { message: "نام دست‌کم دو نویسه باشد." }).max(80),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(200)
    .optional()
    .transform((value) => value || undefined)
    .refine((value) => !value || z.email().safeParse(value).success, { message: "ایمیل معتبر نیست." }),
});
export type ProfileInput = z.infer<typeof profileSchema>;

export const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, { message: "رمز فعلی را وارد کنید." }),
    newPassword: z
      .string()
      .min(10, { message: "رمز جدید دست‌کم ۱۰ نویسه باشد." })
      .max(200, { message: "رمز جدید بیش از حد طولانی است." }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "تکرار رمز با رمز جدید یکی نیست.",
  });
export type PasswordInput = z.infer<typeof passwordSchema>;
