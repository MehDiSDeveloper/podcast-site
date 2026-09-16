"use server";

import { inquirySchema, type InquiryFormState, type InquiryInput } from "@/lib/validation/inquiry";
import { createInquiry, RateLimitError } from "@/server/inquiries";
import { getClientIp, getUserAgent, hashIp } from "@/server/request";

const FIELD_NAMES = [
  "name",
  "email",
  "phone",
  "company",
  "roleTitle",
  "collaborationType",
  "teamSize",
  "timeline",
  "message",
] as const;

export async function submitInquiry(
  _previous: InquiryFormState,
  formData: FormData,
): Promise<InquiryFormState> {
  const values = Object.fromEntries(
    FIELD_NAMES.map((field) => [field, String(formData.get(field) ?? "")]),
  );

  // Honeypot: a field hidden from people but filled in by naive bots. Pretend
  // success so the bot has no signal to adapt to.
  if (String(formData.get("website") ?? "").trim() !== "") {
    return { status: "success" };
  }

  // Bots that post instantly are another tell; real people take a few seconds.
  const startedAt = Number(formData.get("startedAt"));
  if (Number.isFinite(startedAt) && startedAt > 0 && Date.now() - startedAt < 2500) {
    return { status: "success" };
  }

  const parsed = inquirySchema.safeParse({
    ...values,
    consent: formData.get("consent") ?? undefined,
  });

  if (!parsed.success) {
    const fieldErrors: Partial<Record<keyof InquiryInput, string>> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof InquiryInput;
      fieldErrors[key] ??= issue.message;
    }
    return {
      status: "error",
      message: "چند مورد نیاز به اصلاح دارد. لطفاً فیلدهای مشخص‌شده را بررسی کنید.",
      fieldErrors,
      values,
    };
  }

  try {
    await createInquiry(parsed.data, {
      ipHash: hashIp(await getClientIp()),
      userAgent: await getUserAgent(),
      sourcePath: String(formData.get("sourcePath") ?? "") || undefined,
      referrer: String(formData.get("referrer") ?? "") || undefined,
    });
  } catch (error) {
    if (error instanceof RateLimitError) {
      return {
        status: "error",
        message: "در یک ساعت گذشته چند درخواست از شما دریافت شده است. لطفاً کمی بعد دوباره تلاش کنید.",
        values,
      };
    }

    console.error("[contact] failed to save inquiry:", error);
    return {
      status: "error",
      message: "ارسال پیام با خطا روبه‌رو شد. لطفاً دوباره تلاش کنید یا مستقیم ایمیل بزنید.",
      values,
    };
  }

  return { status: "success" };
}
