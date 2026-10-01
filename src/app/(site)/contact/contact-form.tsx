"use client";

import { CheckCircle2, Send } from "lucide-react";
import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";

import { Button, buttonStyles } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { COLLABORATION_TYPE_LABELS, COLLABORATION_TYPES, TEAM_SIZES, TIMELINES, type CollaborationType } from "@/lib/enums";
import { cn } from "@/lib/utils";
import type { InquiryFormState } from "@/lib/validation/inquiry";

import { submitInquiry } from "./actions";

/** Fields kept in the draft; hidden meta fields and the honeypot are left out. */
const DRAFT_FIELDS = [
  "name",
  "email",
  "phone",
  "company",
  "roleTitle",
  "collaborationType",
  "teamSize",
  "timeline",
  "message",
  "consent",
] as const;

// sessionStorage: survives a reload or the error page, but not closing the tab.
const DRAFT_KEY = "contact-draft";

function readDraft(): Record<string, string> | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : null;
  } catch {
    return null;
  }
}

function formValues(form: HTMLFormElement | FormData): Record<string, string> {
  const data = form instanceof FormData ? form : new FormData(form);
  return Object.fromEntries(DRAFT_FIELDS.map((field) => [field, String(data.get(field) ?? "")]));
}

/**
 * A request that never gets an answer (server restarting, network drop, a page
 * left open across a deploy) makes the action throw. Uncaught, that replaces
 * the whole page with the error boundary and loses everything typed, so turn
 * it into a normal form error instead.
 */
async function submitSafely(previous: InquiryFormState, formData: FormData): Promise<InquiryFormState> {
  try {
    return await submitInquiry(previous, formData);
  } catch (error) {
    console.error("[contact] submit failed:", error);
    return {
      status: "error",
      message:
        "ارتباط با سرور برقرار نشد و پیام ارسال نشد. نوشته‌هایتان سر جایشان است؛ چند لحظه بعد دوباره «ارسال» را بزنید. اگر باز هم نشد، صفحه را تازه کنید — متن‌تان پاک نمی‌شود.",
      values: formValues(formData),
    };
  }
}

export function ContactForm({ defaultType }: { defaultType?: CollaborationType }) {
  const [state, formAction, pending] = useActionState<InquiryFormState, FormData>(submitSafely, {
    status: "idle",
  });

  const formRef = useRef<HTMLFormElement>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const startedAt = useRef(0);

  useEffect(() => {
    startedAt.current = Date.now();

    // Bring back a draft from before a reload or a crash. Inputs are
    // uncontrolled, so fill them directly rather than re-rendering.
    const form = formRef.current;
    const draft = readDraft();
    if (!form || !draft) return;
    for (const [name, value] of Object.entries(draft)) {
      if (!value) continue;
      const control = form.elements.namedItem(name);
      if (control instanceof RadioNodeList) {
        control.value = value;
      } else if (control instanceof HTMLInputElement && control.type === "checkbox") {
        control.checked = true;
      } else if (
        control instanceof HTMLInputElement ||
        control instanceof HTMLTextAreaElement ||
        control instanceof HTMLSelectElement
      ) {
        control.value = value;
      }
    }
  }, []);

  function saveDraft(form: HTMLFormElement) {
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(formValues(form)));
    } catch {
      // Storage full or blocked: the draft is a convenience, not a requirement.
    }
  }

  // Browser-only context is written into the hidden fields just before the
  // action reads the form, so no extra render is needed to hold it.
  function fillMeta(form: HTMLFormElement) {
    const set = (name: string, value: string) => {
      const input = form.elements.namedItem(name);
      if (input instanceof HTMLInputElement) input.value = value;
    };
    set("startedAt", String(startedAt.current));
    set("sourcePath", window.location.pathname + window.location.search);
    set("referrer", document.referrer);
  }

  // After a failed submit, move focus to the first invalid field so keyboard and
  // screen-reader users land exactly where the problem is.
  useEffect(() => {
    if (state.status === "error" && state.fieldErrors) {
      // Match controls only: the radiogroup wrapper also carries aria-invalid
      // but is a plain div, and focusing it would silently do nothing.
      const first = formRef.current?.querySelector<HTMLElement>(
        '[role="radiogroup"][aria-invalid="true"] input, input[aria-invalid="true"], textarea[aria-invalid="true"], select[aria-invalid="true"]',
      );
      first?.focus();
    }
    if (state.status === "success") {
      try {
        sessionStorage.removeItem(DRAFT_KEY);
      } catch {}
      successRef.current?.focus();
    }
  }, [state]);

  if (state.status === "success") {
    return (
      <div
        ref={successRef}
        tabIndex={-1}
        role="status"
        className="glass rounded-2xl p-8 text-center outline-none md:p-12"
      >
        <CheckCircle2 className="mx-auto size-14 text-success" aria-hidden="true" />
        <h2 className="mt-5 text-2xl">پیام‌تان رسید</h2>
        <p className="mx-auto mt-3 max-w-md leading-loose text-ink-muted">
          ممنون که وقت گذاشتید. پیام با دقت خوانده می‌شود و پاسخ آن به ایمیلی که وارد کردید
          ارسال می‌شود.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/episodes" className={buttonStyles({ variant: "outline" })}>
            تا آن زمان، یک اپیزود بشنوید
          </Link>
        </div>
      </div>
    );
  }

  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};
  const values = state.status === "error" ? (state.values ?? {}) : {};
  const selectedType = (values.collaborationType as CollaborationType | undefined) ?? defaultType;
  // React applies a <select>'s defaultValue only on mount, and React 19 resets
  // the form after every submit — so the selects below are keyed by the echoed
  // value to remount with it, or a failed submit would silently blank them.

  return (
    <form
      ref={formRef}
      action={formAction}
      onSubmit={(event) => fillMeta(event.currentTarget)}
      onChange={(event) => saveDraft(event.currentTarget)}
      noValidate
      className="flex flex-col gap-7"
    >
      {state.status === "error" ? (
        <div role="alert" className="rounded-xl border border-danger/30 bg-danger-soft px-4 py-3.5 text-sm font-medium text-danger">
          {state.message}
        </div>
      ) : null}

      {/* Anti-spam: invisible to people, tempting to bots. */}
      <div aria-hidden="true" className="sr-only">
        <label htmlFor="website">وب‌سایت</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <input type="hidden" name="startedAt" defaultValue="" />
      <input type="hidden" name="sourcePath" defaultValue="" />
      <input type="hidden" name="referrer" defaultValue="" />

      {/* Collaboration type as cards: the options are the offer, so show them. */}
      <fieldset>
        <legend className="text-sm font-semibold text-ink">
          به کدام شکل کار نزدیک‌تر است؟
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
        <Field name="phone" label="شماره‌ی تماس" hint="برای هماهنگی سریع‌تر؛ اختیاری." error={errors.phone}>
          {(props) => (
            <Input
              {...props}
              type="tel"
              dir="ltr"
              autoComplete="tel"
              inputMode="tel"
              placeholder="0912 000 0000"
              defaultValue={values.phone}
            />
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
        <Field name="teamSize" label="اندازه‌ی تیم" error={errors.teamSize}>
          {(props) => (
            <Select {...props} key={values.teamSize ?? ""} defaultValue={values.teamSize ?? ""}>
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
          <Select {...props} key={values.timeline ?? ""} defaultValue={values.timeline ?? ""}>
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
        label="درباره‌ی مسئله"
        hint="چه می‌گذرد، از کی، و تا امروز چه چیزهایی امتحان شده است."
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
            defaultChecked={values.consent === "on"}
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
        <p className="text-xs text-ink-subtle">هر پیام پاسخ می‌گیرد.</p>
        <Button type="submit" size="lg" disabled={pending} className="sm:min-w-44">
          {pending ? (
            <>
              <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
              در حال ارسال…
            </>
          ) : (
            <>
              ارسال
              <Send className="size-4 -scale-x-100" aria-hidden="true" />
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
