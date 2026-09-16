"use client";

import { CheckCircle2, Send } from "lucide-react";
import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";

import { Button, buttonStyles } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { COLLABORATION_TYPE_LABELS, COLLABORATION_TYPES, TEAM_SIZES, TIMELINES, type CollaborationType } from "@/lib/enums";
import { cn } from "@/lib/utils";
import type { InquiryFormState } from "@/lib/validation/inquiry";

import { submitInquiry } from "./actions";

export function ContactForm({ defaultType }: { defaultType?: CollaborationType }) {
  const [state, formAction, pending] = useActionState<InquiryFormState, FormData>(submitInquiry, {
    status: "idle",
  });

  const formRef = useRef<HTMLFormElement>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const [meta, setMeta] = useState({ startedAt: "", sourcePath: "", referrer: "" });

  // Captured after mount: these are only meaningful in the browser.
  useEffect(() => {
    setMeta({
      startedAt: String(Date.now()),
      sourcePath: window.location.pathname + window.location.search,
      referrer: document.referrer,
    });
  }, []);

  // After a failed submit, move focus to the first invalid field so keyboard and
  // screen-reader users land exactly where the problem is.
  useEffect(() => {
    if (state.status === "error" && state.fieldErrors) {
      // Match controls only: the radiogroup wrapper also carries aria-invalid
      // but is a plain div, and focusing it would silently do nothing.
      const first = formRef.current?.querySelector<HTMLElement>(
        'input[aria-invalid="true"], textarea[aria-invalid="true"], select[aria-invalid="true"]',
      );
      first?.focus();
    }
    if (state.status === "success") {
      successRef.current?.focus();
    }
  }, [state]);

  if (state.status === "success") {
    return (
      <div
        ref={successRef}
        tabIndex={-1}
        role="status"
        className="rounded-2xl border border-line bg-surface p-8 text-center outline-none md:p-12"
      >
        <CheckCircle2 className="mx-auto size-14 text-success" aria-hidden="true" />
        <h2 className="mt-5 text-2xl">پیام شما رسید</h2>
        <p className="mx-auto mt-3 max-w-md leading-loose text-ink-muted">
          ممنون که وقت گذاشتید. درخواست را می‌خوانم و معمولاً ظرف دو روز کاری با ایمیلی که وارد کردید
          تماس می‌گیرم.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/episodes" className={buttonStyles({ variant: "outline" })}>
            در این فاصله، یک اپیزود بشنوید
          </Link>
        </div>
      </div>
    );
  }

  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};
  const values = state.status === "error" ? (state.values ?? {}) : {};
  const selectedType = (values.collaborationType as CollaborationType | undefined) ?? defaultType;

  return (
    <form ref={formRef} action={formAction} noValidate className="flex flex-col gap-7">
      {state.status === "error" ? (
        <div role="alert" className="rounded-xl border border-danger/30 bg-danger-soft px-4 py-3.5 text-sm font-medium text-danger">
          {state.message}
        </div>
      ) : null}

      {/* Anti-spam: invisible to people, tempting to bots. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="website">وب‌سایت</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <input type="hidden" name="startedAt" value={meta.startedAt} />
      <input type="hidden" name="sourcePath" value={meta.sourcePath} />
      <input type="hidden" name="referrer" value={meta.referrer} />

      {/* Collaboration type as cards: the options are the offer, so show them. */}
      <fieldset>
        <legend className="text-sm font-semibold text-ink">
          چه نوع همکاری‌ای در نظر دارید؟
          <span className="text-danger" aria-hidden="true">
            {" *"}
          </span>
        </legend>
        <div
          className="mt-3 grid gap-2.5 sm:grid-cols-2"
          role="radiogroup"
          aria-invalid={errors.collaborationType ? true : undefined}
          aria-describedby={errors.collaborationType ? "collaborationType-error" : undefined}
        >
          {COLLABORATION_TYPES.map((type) => (
            <label
              key={type}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-xl border bg-surface px-4 py-3.5 text-sm font-medium transition-colors",
                "has-[:checked]:border-brand has-[:checked]:bg-brand-soft has-[:checked]:text-brand-strong",
                "has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-brand/20",
                errors.collaborationType ? "border-danger" : "border-line-strong hover:border-ink-subtle",
              )}
            >
              <input
                type="radio"
                name="collaborationType"
                value={type}
                defaultChecked={selectedType === type}
                aria-invalid={errors.collaborationType ? true : undefined}
                className="size-4 accent-[var(--brand)]"
              />
              {COLLABORATION_TYPE_LABELS[type]}
            </label>
          ))}
        </div>
        {errors.collaborationType ? (
          <p id="collaborationType-error" className="mt-2 text-xs font-medium text-danger">
            {errors.collaborationType}
          </p>
        ) : null}
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field name="name" label="نام و نام خانوادگی" required error={errors.name}>
          {(props) => <Input {...props} autoComplete="name" defaultValue={values.name} />}
        </Field>
        <Field name="email" label="ایمیل کاری" required error={errors.email}>
          {(props) => (
            <Input {...props} type="email" dir="ltr" autoComplete="email" inputMode="email" defaultValue={values.email} />
          )}
        </Field>
        <Field name="company" label="نام سازمان" error={errors.company}>
          {(props) => <Input {...props} autoComplete="organization" defaultValue={values.company} />}
        </Field>
        <Field name="roleTitle" label="سمت شما" error={errors.roleTitle}>
          {(props) => (
            <Input
              {...props}
              autoComplete="organization-title"
              placeholder="مثلاً مدیر منابع انسانی"
              defaultValue={values.roleTitle}
            />
          )}
        </Field>
        <Field name="phone" label="شماره‌ی تماس" error={errors.phone}>
          {(props) => (
            <Input {...props} type="tel" dir="ltr" autoComplete="tel" inputMode="tel" defaultValue={values.phone} />
          )}
        </Field>
        <Field name="teamSize" label="اندازه‌ی تیم" error={errors.teamSize}>
          {(props) => (
            <Select {...props} defaultValue={values.teamSize ?? ""}>
              <option value="">انتخاب کنید</option>
              {TEAM_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </div>

      <Field name="timeline" label="زمان‌بندی" error={errors.timeline}>
        {(props) => (
          <Select {...props} defaultValue={values.timeline ?? ""}>
            <option value="">انتخاب کنید</option>
            {TIMELINES.map((timeline) => (
              <option key={timeline} value={timeline}>
                {timeline}
              </option>
            ))}
          </Select>
        )}
      </Field>

      <Field
        name="message"
        label="درباره‌ی نیازتان بگویید"
        hint="چه مسئله‌ای در تیم یا سازمان‌تان هست و چه نتیجه‌ای انتظار دارید؟ جزئیات بیشتر، پاسخ دقیق‌تری می‌سازد."
        required
        error={errors.message}
      >
        {(props) => <Textarea {...props} rows={6} defaultValue={values.message} />}
      </Field>

      <div>
        <label className="flex cursor-pointer items-start gap-3 text-sm leading-loose text-ink-muted">
          <input
            type="checkbox"
            name="consent"
            aria-invalid={errors.consent ? true : undefined}
            aria-describedby={errors.consent ? "consent-error" : undefined}
            className="mt-1.5 size-4 shrink-0 accent-[var(--brand)]"
          />
          <span>
            موافقم اطلاعاتم فقط برای پاسخ به همین درخواست استفاده شود. این اطلاعات با هیچ‌کس به اشتراک
            گذاشته نمی‌شود.
          </span>
        </label>
        {errors.consent ? (
          <p id="consent-error" className="mt-2 text-xs font-medium text-danger">
            {errors.consent}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col-reverse items-stretch gap-4 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-ink-subtle">پاسخ معمولاً ظرف دو روز کاری ارسال می‌شود.</p>
        <Button type="submit" size="lg" disabled={pending} className="sm:min-w-44">
          {pending ? (
            <>
              <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
              در حال ارسال…
            </>
          ) : (
            <>
              ارسال درخواست
              <Send className="size-4 -scale-x-100" aria-hidden="true" />
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
