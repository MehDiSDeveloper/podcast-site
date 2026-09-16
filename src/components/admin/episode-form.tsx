"use client";

import { Link2, Loader2, Upload, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { saveEpisodeAction, type EpisodeFormState } from "@/app/(admin)/admin/(panel)/episodes/actions";
import { Checkbox, FormSection, FormStatus, SubmitButton, useFormAction } from "@/components/admin/form-parts";
import { detectAudioDuration, formatBytes, parseDuration, uploadFile } from "@/components/admin/media";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import {
  EPISODE_STATUS_LABELS,
  EPISODE_STATUSES,
  EPISODE_TYPE_LABELS,
  EPISODE_TYPES,
} from "@/lib/enums";
import { sanitizeHtml } from "@/lib/sanitize";
import { useClientValue } from "@/lib/use-client-value";
import { cn, formatDuration, slugify } from "@/lib/utils";

export type EpisodeFormValues = {
  id?: string;
  title: string;
  slug: string;
  subtitle: string;
  description: string;
  showNotes: string;
  transcript: string;
  audioUrl: string;
  audioSizeBytes: number;
  audioMimeType: string;
  durationSeconds: number;
  coverImage: string;
  episodeNumber: number | null;
  seasonNumber: number | null;
  episodeType: string;
  status: string;
  publishedAt: string | null;
  featured: boolean;
  explicit: boolean;
  topicIds: string[];
  seoTitle: string;
  seoDescription: string;
};

export function EpisodeForm({
  initial,
  topics,
}: {
  initial: EpisodeFormValues;
  topics: { id: string; name: string }[];
}) {
  const { state, pending, onSubmit } = useFormAction<EpisodeFormState>(saveEpisodeAction, { status: "idle" });
  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};
  const [title, setTitle] = useState(initial.title);
  const [slug, setSlug] = useState(initial.slug);
  const [notes, setNotes] = useState(initial.showNotes);
  const [previewNotes, setPreviewNotes] = useState(false);
  const [uploading, setUploading] = useState(false);

  // datetime-local has no timezone, so the value is derived in the browser's
  // own zone. The input is rendered only on the client, which keeps the
  // server's (possibly different) timezone out of the hydrated markup.
  const isClient = useClientValue(() => true, false);
  const [publishedLocal, setPublishedLocal] = useState(() => {
    if (!initial.publishedAt) return "";
    const date = new Date(initial.publishedAt);
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  });

  const statusRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (state.status !== "idle") statusRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [state]);

  return (
    <form noValidate onSubmit={onSubmit} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
      {initial.id ? <input type="hidden" name="id" value={initial.id} /> : null}

      <div className="flex min-w-0 flex-col gap-6">
        <div ref={statusRef}>
          <FormStatus state={state} />
        </div>

        <FormSection title="محتوا">
          <Field name="title" label="عنوان" required error={errors.title}>
            {(props) => <Input {...props} value={title} onChange={(event) => setTitle(event.target.value)} />}
          </Field>

          <Field
            name="slug"
            label="نامک (آدرس صفحه)"
            hint={`/episodes/${slugify(slug || title) || "…"}`}
            error={errors.slug}
          >
            {(props) => (
              <Input
                {...props}
                value={slug}
                onChange={(event) => setSlug(event.target.value)}
                placeholder="خالی بگذارید تا از روی عنوان ساخته شود"
              />
            )}
          </Field>

          <Field name="subtitle" label="زیرعنوان" error={errors.subtitle}>
            {(props) => <Input {...props} defaultValue={initial.subtitle} />}
          </Field>

          <Field
            name="description"
            label="خلاصه"
            hint="در کارت‌ها، نتایج جست‌وجو و فید پادکست نمایش داده می‌شود. یک یا دو جمله."
            required
            error={errors.description}
          >
            {(props) => <Textarea {...props} rows={3} defaultValue={initial.description} />}
          </Field>

          <Field
            name="showNotes"
            label="یادداشت‌های اپیزود"
            hint="HTML ساده: <p>، <h2>، <ul>/<li>، <strong>، <a href>، <blockquote>. لینک به منابع و اپیزودهای مرتبط برای سئو ارزشمند است."
            error={errors.showNotes}
          >
            {(props) => (
              <div className="flex flex-col gap-2">
                <div className="flex gap-1 self-end rounded-lg bg-surface-2 p-1 text-xs font-semibold">
                  {[
                    [false, "ویرایش"],
                    [true, "پیش‌نمایش"],
                  ].map(([value, label]) => (
                    <button
                      key={String(label)}
                      type="button"
                      onClick={() => setPreviewNotes(value as boolean)}
                      aria-pressed={previewNotes === value}
                      className={cn(
                        "rounded-md px-3 py-1.5 transition-colors",
                        previewNotes === value ? "bg-surface text-ink shadow-subtle" : "text-ink-muted",
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {/* The textarea stays mounted while previewing so its value is still submitted. */}
                <Textarea
                  {...props}
                  rows={12}
                  dir="auto"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  className={cn("font-mono text-sm", previewNotes && "hidden")}
                />
                {previewNotes ? (
                  <div
                    className="rich-text min-h-40 rounded-lg border border-line-strong bg-canvas p-4"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(notes) || "<p>—</p>" }}
                  />
                ) : null}
              </div>
            )}
          </Field>

          <details className="group rounded-xl border border-line">
            <summary className="cursor-pointer px-4 py-3 text-sm font-semibold">متن کامل اپیزود (ترنسکریپت)</summary>
            <div className="px-4 pb-4">
              <Textarea
                name="transcript"
                rows={10}
                defaultValue={initial.transcript}
                aria-label="متن کامل اپیزود"
                placeholder="پاراگراف‌ها را با یک خط خالی از هم جدا کنید. متن کامل، اپیزود را برای موتورهای جست‌وجو قابل‌خواندن می‌کند."
              />
            </div>
          </details>
        </FormSection>

        <FormSection title="فایل صوتی" description="فایل را همین‌جا بارگذاری کنید یا آدرس آن در سرویس میزبانی‌تان را وارد کنید.">
          <AudioField initial={initial} errors={errors} onUploadingChange={setUploading} />
        </FormSection>

        <FormSection title="سئو" description="اختیاری. اگر خالی بماند، از عنوان و خلاصه استفاده می‌شود.">
          <Field name="seoTitle" label="عنوان سئو" hint="حدود ۶۰ نویسه." error={errors.seoTitle}>
            {(props) => <Input {...props} defaultValue={initial.seoTitle} />}
          </Field>
          <Field name="seoDescription" label="توضیح متا" hint="حدود ۱۵۰ نویسه." error={errors.seoDescription}>
            {(props) => <Textarea {...props} rows={2} defaultValue={initial.seoDescription} />}
          </Field>
        </FormSection>
      </div>

      <div className="flex flex-col gap-6 xl:sticky xl:top-22 xl:self-start">
        <FormSection title="انتشار">
          <Field name="status" label="وضعیت" required error={errors.status}>
            {(props) => (
              <Select {...props} defaultValue={initial.status}>
                {EPISODE_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {EPISODE_STATUS_LABELS[status]}
                  </option>
                ))}
              </Select>
            )}
          </Field>

          <Field
            name="publishedAtLocal"
            label="تاریخ انتشار"
            hint="برای انتشار فوری خالی بگذارید. تاریخ آینده یعنی زمان‌بندی."
            error={errors.publishedAt}
          >
            {(props) =>
              isClient ? (
                <Input
                  {...props}
                  type="datetime-local"
                  dir="ltr"
                  value={publishedLocal}
                  onChange={(event) => setPublishedLocal(event.target.value)}
                />
              ) : (
                <Input {...props} type="datetime-local" dir="ltr" disabled />
              )
            }
          </Field>
          <input
            type="hidden"
            name="publishedAt"
            value={
              isClient
                ? publishedLocal
                  ? new Date(publishedLocal).toISOString()
                  : ""
                : (initial.publishedAt ?? "")
            }
          />

          <Checkbox name="featured" label="اپیزود پیشنهادی" hint="در بخش اصلی صفحه‌ی خانه نمایش داده می‌شود." defaultChecked={initial.featured} />
          <Checkbox name="explicit" label="محتوای بزرگسال" hint="در فید پادکست علامت‌گذاری می‌شود." defaultChecked={initial.explicit} />

          <div className="flex items-center justify-end gap-2 border-t border-line pt-5">
            <SubmitButton pending={pending || uploading}>{initial.id ? "ذخیره‌ی تغییرات" : "ایجاد اپیزود"}</SubmitButton>
          </div>
          {uploading ? <p className="text-xs text-ink-subtle">صبر کنید تا بارگذاری تمام شود.</p> : null}
        </FormSection>

        <FormSection title="مشخصات">
          <div className="grid grid-cols-2 gap-4">
            <Field name="episodeNumber" label="شماره" error={errors.episodeNumber}>
              {(props) => <Input {...props} type="number" min={1} dir="ltr" defaultValue={initial.episodeNumber ?? ""} />}
            </Field>
            <Field name="seasonNumber" label="فصل" error={errors.seasonNumber}>
              {(props) => <Input {...props} type="number" min={1} dir="ltr" defaultValue={initial.seasonNumber ?? ""} />}
            </Field>
          </div>
          <Field name="episodeType" label="نوع" required error={errors.episodeType}>
            {(props) => (
              <Select {...props} defaultValue={initial.episodeType}>
                {EPISODE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {EPISODE_TYPE_LABELS[type]}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </FormSection>

        <FormSection title="موضوع‌ها" description="اپیزود در صفحه‌ی هر موضوع انتخاب‌شده فهرست می‌شود.">
          {topics.length === 0 ? (
            <p className="text-sm text-ink-subtle">هنوز موضوعی تعریف نشده است.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {topics.map((topic) => (
                <label
                  key={topic.id}
                  className="cursor-pointer rounded-full border border-line-strong px-3.5 py-1.5 text-sm transition-colors has-[:checked]:border-brand has-[:checked]:bg-brand-soft has-[:checked]:text-brand-strong has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-brand/20"
                >
                  <input
                    type="checkbox"
                    name="topicIds"
                    value={topic.id}
                    defaultChecked={initial.topicIds.includes(topic.id)}
                    className="sr-only"
                  />
                  {topic.name}
                </label>
              ))}
            </div>
          )}
        </FormSection>

        <FormSection title="تصویر اختصاصی">
          <CoverField initial={initial.coverImage} error={errors.coverImage} onUploadingChange={setUploading} />
        </FormSection>
      </div>
    </form>
  );
}

function AudioField({
  initial,
  errors,
  onUploadingChange,
}: {
  initial: EpisodeFormValues;
  errors: Partial<Record<string, string>>;
  onUploadingChange: (value: boolean) => void;
}) {
  const [mode, setMode] = useState<"upload" | "url">(
    initial.audioUrl && !initial.audioUrl.startsWith("/uploads/") ? "url" : "upload",
  );
  const [audioUrl, setAudioUrl] = useState(initial.audioUrl);
  const [size, setSize] = useState(initial.audioSizeBytes);
  const [mime, setMime] = useState(initial.audioMimeType || "audio/mpeg");
  const [durationText, setDurationText] = useState(initial.durationSeconds ? formatDuration(initial.durationSeconds) : "");
  const [progress, setProgress] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const seconds = parseDuration(durationText) ?? 0;

  async function handleFile(file: File) {
    setMessage(null);
    const detected = await detectAudioDuration(file);
    if (detected) setDurationText(formatDuration(detected));

    setProgress(0);
    onUploadingChange(true);
    try {
      const uploaded = await uploadFile(file, "audio", setProgress);
      setAudioUrl(uploaded.url);
      setSize(uploaded.size);
      setMime(uploaded.type);
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setProgress(null);
      onUploadingChange(false);
    }
  }

  async function handleUrlBlur() {
    if (!/^https?:\/\//.test(audioUrl)) return;
    setSize(0); // the server looks up the real size with a HEAD request
    setMime(/\.m4a(\?|$)/i.test(audioUrl) ? "audio/mp4" : "audio/mpeg");
    const detected = await detectAudioDuration(audioUrl);
    if (detected && !durationText) setDurationText(formatDuration(detected));
    if (!detected) setMessage("مدت فایل خودکار خوانده نشد؛ آن را دستی وارد کنید.");
  }

  return (
    <>
      <input type="hidden" name="audioUrl" value={audioUrl} />
      <input type="hidden" name="audioSizeBytes" value={size} />
      <input type="hidden" name="audioMimeType" value={mime} />
      <input type="hidden" name="durationSeconds" value={seconds} />

      <div className="flex gap-1 self-start rounded-lg bg-surface-2 p-1 text-sm font-semibold" role="tablist">
        {(
          [
            ["upload", "بارگذاری فایل", Upload],
            ["url", "آدرس خارجی", Link2],
          ] as const
        ).map(([value, label, Icon]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={mode === value}
            onClick={() => setMode(value)}
            className={cn(
              "inline-flex items-center gap-2 rounded-md px-3.5 py-2 transition-colors",
              mode === value ? "bg-surface text-ink shadow-subtle" : "text-ink-muted hover:text-ink",
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>

      {mode === "upload" ? (
        <div>
          <label
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors",
              errors.audioUrl ? "border-danger" : "border-line-strong hover:border-brand hover:bg-brand-soft/40",
            )}
          >
            {progress !== null ? (
              <Loader2 className="size-6 animate-spin text-brand" aria-hidden="true" />
            ) : (
              <Upload className="size-6 text-ink-subtle" aria-hidden="true" />
            )}
            <span className="text-sm font-semibold">
              {progress !== null ? `در حال بارگذاری… ${Math.round(progress * 100)}٪` : "انتخاب فایل صوتی"}
            </span>
            <span className="text-xs text-ink-subtle">MP3، M4A، AAC، OGG یا WAV — حداکثر ۳۰۰ مگابایت</span>
            <input
              type="file"
              accept="audio/*"
              className="sr-only"
              disabled={progress !== null}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void handleFile(file);
                event.target.value = "";
              }}
            />
          </label>
          {progress !== null ? (
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-2" aria-hidden="true">
              <div className="h-full bg-brand transition-[width]" style={{ width: `${progress * 100}%` }} />
            </div>
          ) : null}
        </div>
      ) : (
        <Field name="audioUrlInput" label="آدرس فایل صوتی" hint="لینک مستقیم به فایل MP3 یا M4A." required error={errors.audioUrl}>
          {(props) => (
            <Input
              {...props}
              type="url"
              dir="ltr"
              placeholder="https://…/episode.mp3"
              value={audioUrl.startsWith("/uploads/") ? "" : audioUrl}
              onChange={(event) => setAudioUrl(event.target.value.trim())}
              onBlur={handleUrlBlur}
            />
          )}
        </Field>
      )}

      {mode === "upload" && errors.audioUrl ? <p className="text-xs font-medium text-danger">{errors.audioUrl}</p> : null}
      {message ? <p className="text-xs font-medium text-warning">{message}</p> : null}

      {audioUrl ? (
        <div className="rounded-xl bg-canvas p-3">
          <audio controls preload="metadata" src={audioUrl} className="w-full" />
          <p className="mt-2 text-xs text-ink-subtle" dir="ltr">
            {audioUrl.split("/").pop()} · {formatBytes(size)}
          </p>
        </div>
      ) : null}

      <Field
        name="durationText"
        label="مدت"
        hint="با انتخاب فایل خودکار پر می‌شود. قالب: ساعت:دقیقه:ثانیه"
        required
        error={errors.durationSeconds}
      >
        {(props) => (
          <Input
            {...props}
            dir="ltr"
            inputMode="numeric"
            placeholder="0:42:30"
            value={durationText}
            onChange={(event) => setDurationText(event.target.value)}
            className="max-w-40"
          />
        )}
      </Field>
    </>
  );
}

function CoverField({
  initial,
  error,
  onUploadingChange,
}: {
  initial: string;
  error?: string;
  onUploadingChange: (value: boolean) => void;
}) {
  const [url, setUrl] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleFile(file: File) {
    setBusy(true);
    setMessage(null);
    onUploadingChange(true);
    try {
      setUrl((await uploadFile(file, "image")).url);
    } catch (uploadError) {
      setMessage((uploadError as Error).message);
    } finally {
      setBusy(false);
      onUploadingChange(false);
    }
  }

  return (
    <>
      <input type="hidden" name="coverImage" value={url} />
      {url ? (
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary admin-provided URL */}
          <img src={url} alt="تصویر اپیزود" className="aspect-square w-full rounded-xl object-cover" />
          <button
            type="button"
            onClick={() => setUrl("")}
            aria-label="حذف تصویر"
            className="absolute left-2 top-2 grid size-8 place-items-center rounded-full bg-ink/70 text-ink-inverse hover:bg-ink"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      ) : (
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line-strong px-4 py-6 text-sm font-semibold text-ink-muted transition-colors hover:border-brand">
          {busy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Upload className="size-4" aria-hidden="true" />}
          {busy ? "در حال بارگذاری…" : "بارگذاری تصویر (JPG، PNG، WebP)"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            disabled={busy}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleFile(file);
              event.target.value = "";
            }}
          />
        </label>
      )}
      <p className="text-xs text-ink-subtle">اختیاری. بدون آن، تصویر پیش‌فرض پادکست استفاده می‌شود.</p>
      {message || error ? <p className="text-xs font-medium text-danger">{message ?? error}</p> : null}
    </>
  );
}
