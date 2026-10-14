"use client";

import { useState } from "react";

import { savePodcastAction, type PodcastFormState } from "@/app/(admin)/admin/(panel)/podcast/actions";
import { CoverFields } from "@/components/admin/cover-fields";
import { FormSection, FormStatus, SubmitButton, useFormAction } from "@/components/admin/form-parts";
import { Field, Textarea } from "@/components/ui/field";

export function PodcastForm({
  initial,
  defaultArtwork,
}: {
  initial: { description: string; coverImage: string; coverVideo: string };
  /** The generated artwork used while no cover is uploaded. */
  defaultArtwork: string;
}) {
  const { state, pending, onSubmit } = useFormAction<PodcastFormState>(savePodcastAction, { status: "idle" });
  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};
  const [uploading, setUploading] = useState(false);

  return (
    <form noValidate onSubmit={onSubmit} className="grid max-w-5xl gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="flex min-w-0 flex-col gap-6">
        <FormStatus state={state} />
        <FormSection title="توضیح پادکست">
          <Field
            name="description"
            label="توضیح"
            hint="اپ‌های پادکست این متن را در صفحه‌ی پادکست نشان می‌دهند."
            required
            error={errors.description}
          >
            {(props) => <Textarea {...props} rows={8} defaultValue={initial.description} />}
          </Field>
        </FormSection>
      </div>

      <div className="flex flex-col gap-6 lg:sticky lg:top-22 lg:self-start">
        <FormSection title="کاور پادکست" description="اپیزودهای بدون کاور هم همین کاور را می‌گیرند.">
          <CoverFields
            initialImage={initial.coverImage}
            initialVideo={initial.coverVideo}
            fallbackImage={defaultArtwork}
            fallbackLabel="فعلاً تصویر پیش‌فرض"
            error={errors.coverImage ?? errors.coverVideo}
            onUploadingChange={setUploading}
          />
          <div className="flex justify-end border-t border-line pt-5">
            <SubmitButton pending={pending || uploading}>ذخیره</SubmitButton>
          </div>
          {uploading ? <p className="text-xs text-ink-subtle">صبر کنید تا بارگذاری تمام شود.</p> : null}
        </FormSection>
      </div>
    </form>
  );
}
