"use client";

import { FormStatus, PrefixedField, SubmitButton, useFormAction } from "@/components/admin/form-parts";
import { Input } from "@/components/ui/field";
import type { FormState } from "@/lib/validation/episode";

export type TermFormState = FormState<"name" | "slug" | "sortOrder">;

export type TermFormValues = {
  id?: string;
  name: string;
  slug: string;
  /** Omitted for terms without a manual order (tags). */
  sortOrder?: number;
};

/** Name + slug (+ order) form shared by lenses and tags. */
export function TermForm({
  action,
  initial,
  nameLabel,
  createLabel,
}: {
  action: (state: TermFormState, formData: FormData) => Promise<TermFormState>;
  initial: TermFormValues;
  nameLabel: string;
  createLabel: string;
}) {
  const { state, pending, onSubmit } = useFormAction<TermFormState>(action, { status: "idle" });
  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};
  const prefix = initial.id ?? "new";
  const hasOrder = initial.sortOrder !== undefined;

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {initial.id ? <input type="hidden" name="id" value={initial.id} /> : null}
      <FormStatus state={state} />

      <div className={hasOrder ? "grid gap-4 sm:grid-cols-[1fr_1fr_7rem]" : "grid gap-4 sm:grid-cols-2"}>
        <PrefixedField prefix={prefix} name="name" label={nameLabel} required error={errors.name}>
          {(props) => <Input {...props} defaultValue={initial.name} />}
        </PrefixedField>
        <PrefixedField prefix={prefix} name="slug" label="نامک" error={errors.slug}>
          {(props) => <Input {...props} defaultValue={initial.slug} placeholder="خودکار از روی نام" />}
        </PrefixedField>
        {hasOrder ? (
          <PrefixedField prefix={prefix} name="sortOrder" label="ترتیب" error={errors.sortOrder}>
            {(props) => <Input {...props} type="number" min={0} dir="ltr" defaultValue={initial.sortOrder} />}
          </PrefixedField>
        ) : null}
      </div>

      <div className="flex justify-end">
        <SubmitButton pending={pending}>{initial.id ? "ذخیره" : createLabel}</SubmitButton>
      </div>
    </form>
  );
}
