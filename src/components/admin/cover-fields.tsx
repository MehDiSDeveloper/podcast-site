"use client";

import { Loader2, RefreshCw, Trash2, Upload } from "lucide-react";
import { useState } from "react";

import { readMediaSize, uploadFile } from "@/components/admin/media";
import { isGif } from "@/lib/cover";
import { cn, toFaDigits } from "@/lib/utils";

/**
 * The two cover inputs shared by the podcast settings and the episode form:
 * a square JPG/PNG that podcast apps show, and an optional animated version
 * (MP4/WebM/GIF, e.g. a Canva export) that only the site plays. Each slot
 * previews its file and can be replaced or removed; the values are submitted
 * as `coverImage` and `coverVideo`.
 */
export function CoverFields({
  initialImage,
  initialVideo,
  fallbackImage,
  fallbackLabel,
  error,
  onImageChange,
  onUploadingChange,
}: {
  initialImage: string;
  initialVideo: string;
  /** Shown faded while there is no image, so the admin sees what will be used instead. */
  fallbackImage: string;
  fallbackLabel: string;
  error?: string;
  onImageChange?: (url: string) => void;
  onUploadingChange: (value: boolean) => void;
}) {
  const [image, setImage] = useState(initialImage);
  const [video, setVideo] = useState(initialVideo);

  return (
    <>
      <input type="hidden" name="coverImage" value={image} />
      <input type="hidden" name="coverVideo" value={video} />

      <div className="grid grid-cols-2 gap-3">
        <CoverSlot
          kind="image"
          label="تصویر ثابت"
          value={image}
          fallback={fallbackImage}
          fallbackLabel={fallbackLabel}
          onChange={(url) => {
            setImage(url);
            onImageChange?.(url);
          }}
          onUploadingChange={onUploadingChange}
        />
        <CoverSlot
          kind="animation"
          label="نسخه‌ی متحرک"
          value={video}
          onChange={setVideo}
          onUploadingChange={onUploadingChange}
        />
      </div>

      <ul className="flex list-disc flex-col gap-1 ps-4 text-xs leading-relaxed text-ink-subtle">
        <li>تصویر ثابت: مربع، ۱۴۰۰ تا ۳۰۰۰ پیکسل، JPG یا PNG. همین در اپ‌های پادکست دیده می‌شود.</li>
        <li>نسخه‌ی متحرک (اختیاری): خروجی MP4 یا GIF کنوا. فقط در سایت پخش می‌شود؛ اپ‌های پادکست کاور متحرک را از فید نمی‌خوانند.</li>
      </ul>
      {error ? <p className="text-xs font-medium text-danger">{error}</p> : null}
    </>
  );
}

function CoverSlot({
  kind,
  label,
  value,
  fallback,
  fallbackLabel,
  onChange,
  onUploadingChange,
}: {
  kind: "image" | "animation";
  label: string;
  value: string;
  fallback?: string;
  fallbackLabel?: string;
  onChange: (url: string) => void;
  onUploadingChange: (value: boolean) => void;
}) {
  const [progress, setProgress] = useState<number | null>(null);
  const [message, setMessage] = useState<{ tone: "warning" | "danger"; text: string } | null>(null);
  const accept = kind === "image" ? "image/jpeg,image/png" : "video/mp4,video/webm,image/gif";

  async function handleFile(file: File) {
    setMessage(null);
    const size = await readMediaSize(file);
    setProgress(0);
    onUploadingChange(true);
    try {
      const uploaded = await uploadFile(file, kind, setProgress);
      onChange(uploaded.url);
      const warning = size ? sizeWarning(kind, size) : null;
      if (warning) setMessage({ tone: "warning", text: warning });
    } catch (error) {
      setMessage({ tone: "danger", text: (error as Error).message });
    } finally {
      setProgress(null);
      onUploadingChange(false);
    }
  }

  const picker = (
    <input
      type="file"
      accept={accept}
      className="sr-only"
      disabled={progress !== null}
      onChange={(event) => {
        const file = event.target.files?.[0];
        if (file) void handleFile(file);
        event.target.value = "";
      }}
    />
  );

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <p className="text-sm font-semibold">
        {label}
        {kind === "animation" ? <span className="mr-1 text-xs font-normal text-ink-subtle">(اختیاری)</span> : null}
      </p>

      {value ? (
        <>
          <a href={value} target="_blank" rel="noopener" title="نمایش در اندازه‌ی کامل" className="block">
            <CoverPreview url={value} kind={kind} />
          </a>
          <div className="flex gap-1.5">
            <label
              className={cn(
                "inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-line-strong px-2 py-1.5 text-xs font-semibold transition-colors hover:border-brand hover:text-brand-strong",
                progress !== null && "pointer-events-none opacity-60",
              )}
            >
              {progress !== null ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <RefreshCw className="size-3.5" aria-hidden="true" />
              )}
              {progress !== null ? `${toFaDigits(Math.round(progress * 100))}٪` : "تعویض"}
              {picker}
            </label>
            <button
              type="button"
              onClick={() => {
                onChange("");
                setMessage(null);
              }}
              aria-label={`حذف ${label}`}
              className="grid size-8 place-items-center rounded-lg border border-line-strong text-ink-muted transition-colors hover:border-danger hover:bg-danger-soft hover:text-danger"
            >
              <Trash2 className="size-3.5" aria-hidden="true" />
            </button>
          </div>
        </>
      ) : (
        <label
          className={cn(
            "relative flex aspect-square cursor-pointer flex-col items-center justify-center gap-1.5 overflow-hidden rounded-xl border-2 border-dashed border-line-strong p-2 text-center text-xs font-semibold text-ink-muted transition-colors hover:border-brand",
            progress !== null && "pointer-events-none",
          )}
        >
          {fallback && progress === null ? (
            // eslint-disable-next-line @next/next/no-img-element -- admin preview of an arbitrary cover URL
            <img src={fallback} alt="" className="absolute inset-0 size-full object-cover opacity-20" />
          ) : null}
          <span className="relative flex flex-col items-center gap-1.5">
            {progress !== null ? (
              <Loader2 className="size-5 animate-spin text-brand" aria-hidden="true" />
            ) : (
              <Upload className="size-5" aria-hidden="true" />
            )}
            {progress !== null ? `${toFaDigits(Math.round(progress * 100))}٪` : kind === "image" ? "بارگذاری تصویر" : "بارگذاری MP4 / GIF"}
            {fallback && progress === null ? (
              <span className="font-normal text-ink-subtle">{fallbackLabel}</span>
            ) : null}
          </span>
          {picker}
        </label>
      )}

      {message ? (
        <p className={cn("text-xs font-medium leading-relaxed", message.tone === "danger" ? "text-danger" : "text-warning")}>
          {message.text}
        </p>
      ) : null}
    </div>
  );
}

function CoverPreview({ url, kind }: { url: string; kind: "image" | "animation" }) {
  const className = "aspect-square w-full rounded-xl bg-surface-2 object-cover";
  if (kind === "animation" && !isGif(url)) {
    return <video src={url} autoPlay muted loop playsInline className={className} />;
  }
  // eslint-disable-next-line @next/next/no-img-element -- admin preview of an arbitrary cover URL
  return <img src={url} alt="" className={className} />;
}

/** Podcast apps want 1400–3000px squares; Apple refuses anything else for the show. */
function sizeWarning(kind: "image" | "animation", { width, height }: { width: number; height: number }) {
  const dimensions = `${toFaDigits(width)}×${toFaDigits(height)}`;
  if (width !== height) return `این فایل مربع نیست (${dimensions})؛ در سایت و اپ‌ها لبه‌هایش بریده می‌شود.`;
  if (kind === "image" && width < 1400) return `تصویر ${dimensions} است؛ اپ‌های پادکست (به‌ویژه اپل) دست‌کم ۱۴۰۰×۱۴۰۰ می‌خواهند.`;
  if (kind === "image" && width > 3000) return `تصویر ${dimensions} است؛ اپل پادکست حداکثر ۳۰۰۰×۳۰۰۰ را می‌پذیرد.`;
  return null;
}
