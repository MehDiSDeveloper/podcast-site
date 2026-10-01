"use client";

import { saveCategoryAction, type CategoryFormState } from "@/app/(admin)/admin/(panel)/categories/actions";
import { FormStatus, PrefixedField, SubmitButton, useFormAction } from "@/components/admin/form-parts";
import { Input, Textarea } from "@/components/ui/field";

export type CategoryFormValues = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  body: string;
  accentColor: string;
  sortOrder: number;
  seoTitle: string;
  seoDescription: string;
};

export function CategoryForm({ initial }: { initial: CategoryFormValues }) {
  const { state, pending, onSubmit } = useFormAction<CategoryFormState>(saveCategoryAction, { status: "idle" });
  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};
  // Field ids must be unique when several category forms share the page.
  const prefix = initial.id ?? "new";

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {initial.id ? <input type="hidden" name="id" value={initial.id} /> : null}
      <FormStatus state={state} />

      <div className="grid gap-4 sm:grid-cols-[1fr_1fr_7rem_7rem]">
        <PrefixedField prefix={prefix} name="name" label="نام دسته" required error={errors.name}>
          {(props) => <Input {...props} defaultValue={initial.name} />}
        </PrefixedField>
        <PrefixedField prefix={prefix} name="slug" label="نامک" error={errors.slug}>
          {(props) => <Input {...props} defaultValue={initial.slug} placeholder="خودکار از روی نام" />}
        </PrefixedField>
        <PrefixedField prefix={prefix} name="sortOrder" label="ترتیب" error={errors.sortOrder}>
          {(props) => <Input {...props} type="number" min={0} dir="ltr" defaultValue={initial.sortOrder} />}
        </PrefixedField>
        <PrefixedField prefix={prefix} name="accentColor" label="رنگ" error={errors.accentColor}>
          {(props) => (
            <Input {...props} dir="ltr" placeholder="#2f6f5e" defaultValue={initial.accentColor} />
          )}
        </PrefixedField>
      </div>

      <PrefixedField prefix={prefix} name="description" label="توضیح کوتاه" hint="روی کارت دسته و در توضیح متا." error={errors.description}>
        {(props) => <Input {...props} defaultValue={initial.description} />}
      </PrefixedField>

      <PrefixedField
        prefix={prefix}
        name="body"
        label="متن صفحه‌ی دسته"
        hint="بالای فهرست اپیزودها نمایش داده می‌شود. این صفحه ستون سئو برای این دسته است؛ متن جامع و مفید بنویسید."
        error={errors.body}
      >
        {(props) => <Textarea {...props} rows={5} defaultValue={initial.body} />}
      </PrefixedField>

      <div className="grid gap-4 sm:grid-cols-2">
        <PrefixedField prefix={prefix} name="seoTitle" label="عنوان سئو" error={errors.seoTitle}>
          {(props) => <Input {...props} defaultValue={initial.seoTitle} />}
        </PrefixedField>
        <PrefixedField prefix={prefix} name="seoDescription" label="توضیح متا" error={errors.seoDescription}>
          {(props) => <Input {...props} defaultValue={initial.seoDescription} />}
        </PrefixedField>
      </div>

      <div className="flex justify-end">
        <SubmitButton pending={pending}>{initial.id ? "ذخیره" : "افزودن دسته"}</SubmitButton>
      </div>
    </form>
  );
}
