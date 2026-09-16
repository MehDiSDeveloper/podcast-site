"use client";

import { saveTopicAction, type TopicFormState } from "@/app/(admin)/admin/(panel)/topics/actions";
import { FormStatus, SubmitButton, useFormAction } from "@/components/admin/form-parts";
import { Field, Input, Textarea } from "@/components/ui/field";

export type TopicFormValues = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  body: string;
  sortOrder: number;
  seoTitle: string;
  seoDescription: string;
};

export function TopicForm({ initial }: { initial: TopicFormValues }) {
  const { state, pending, onSubmit } = useFormAction<TopicFormState>(saveTopicAction, { status: "idle" });
  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};
  // Field ids must be unique when several topic forms share the page.
  const prefix = initial.id ?? "new";

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {initial.id ? <input type="hidden" name="id" value={initial.id} /> : null}
      <FormStatus state={state} />

      <div className="grid gap-4 sm:grid-cols-[1fr_1fr_7rem]">
        <FieldWithName prefix={prefix} name="name" label="نام موضوع" required error={errors.name}>
          {(props) => <Input {...props} defaultValue={initial.name} />}
        </FieldWithName>
        <FieldWithName prefix={prefix} name="slug" label="نامک" error={errors.slug}>
          {(props) => <Input {...props} defaultValue={initial.slug} placeholder="خودکار از روی نام" />}
        </FieldWithName>
        <FieldWithName prefix={prefix} name="sortOrder" label="ترتیب" error={errors.sortOrder}>
          {(props) => <Input {...props} type="number" min={0} dir="ltr" defaultValue={initial.sortOrder} />}
        </FieldWithName>
      </div>

      <FieldWithName prefix={prefix} name="description" label="توضیح کوتاه" hint="روی کارت موضوع و در توضیح متا." error={errors.description}>
        {(props) => <Input {...props} defaultValue={initial.description} />}
      </FieldWithName>

      <FieldWithName
        prefix={prefix}
        name="body"
        label="متن صفحه‌ی موضوع"
        hint="بالای فهرست اپیزودها نمایش داده می‌شود. این صفحه ستون سئو برای این موضوع است؛ متن جامع و مفید بنویسید."
        error={errors.body}
      >
        {(props) => <Textarea {...props} rows={5} defaultValue={initial.body} />}
      </FieldWithName>

      <div className="grid gap-4 sm:grid-cols-2">
        <FieldWithName prefix={prefix} name="seoTitle" label="عنوان سئو" error={errors.seoTitle}>
          {(props) => <Input {...props} defaultValue={initial.seoTitle} />}
        </FieldWithName>
        <FieldWithName prefix={prefix} name="seoDescription" label="توضیح متا" error={errors.seoDescription}>
          {(props) => <Input {...props} defaultValue={initial.seoDescription} />}
        </FieldWithName>
      </div>

      <div className="flex justify-end">
        <SubmitButton pending={pending}>{initial.id ? "ذخیره" : "افزودن موضوع"}</SubmitButton>
      </div>
    </form>
  );
}

/** Field with a per-form id prefix, keeping the submitted `name` unchanged. */
function FieldWithName({
  prefix,
  name,
  children,
  ...rest
}: Omit<Parameters<typeof Field>[0], "children"> & {
  prefix: string;
  children: Parameters<typeof Field>[0]["children"];
}) {
  return (
    <Field name={`${prefix}-${name}`} {...rest}>
      {(props) => children({ ...props, name })}
    </Field>
  );
}
