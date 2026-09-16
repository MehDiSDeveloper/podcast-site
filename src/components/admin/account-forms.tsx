"use client";

import {
  changePasswordAction,
  updateProfileAction,
  type PasswordFormState,
  type ProfileFormState,
} from "@/app/(admin)/admin/(panel)/account/actions";
import { FormSection, FormStatus, SubmitButton, useFormAction } from "@/components/admin/form-parts";
import { Field, Input } from "@/components/ui/field";

export function ProfileForm({ name, email }: { name: string; email: string }) {
  const { state, pending, onSubmit } = useFormAction<ProfileFormState>(updateProfileAction, { status: "idle" });
  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};

  return (
    <FormSection title="مشخصات">
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <FormStatus state={state} />
        <Field name="name" label="نام نمایشی" required error={errors.name}>
          {(props) => <Input {...props} autoComplete="name" defaultValue={name} />}
        </Field>
        <Field name="email" label="ایمیل" error={errors.email}>
          {(props) => <Input {...props} type="email" dir="ltr" autoComplete="email" defaultValue={email} />}
        </Field>
        <div className="flex justify-end">
          <SubmitButton pending={pending}>ذخیره</SubmitButton>
        </div>
      </form>
    </FormSection>
  );
}

export function PasswordForm({ syncedFromEnv }: { syncedFromEnv: boolean }) {
  const { state, pending, onSubmit } = useFormAction<PasswordFormState>(changePasswordAction, { status: "idle" });
  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};

  return (
    <FormSection title="تغییر رمز عبور" description="پس از تغییر، همه‌ی نشست‌های دیگر از حساب خارج می‌شوند.">
      {syncedFromEnv ? (
        <p className="rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm leading-loose">
          رمز این حساب از فایل <code dir="ltr">.env</code> خوانده می‌شود و با هر راه‌اندازی دوباره‌ی سرور به همان مقدار
          برمی‌گردد. برای تغییر ماندگار، <code dir="ltr">ADMIN_PASSWORD</code> را در <code dir="ltr">.env</code> عوض کنید
          یا <code dir="ltr">ADMIN_SYNC_PASSWORD=&quot;false&quot;</code> قرار دهید.
        </p>
      ) : null}
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <FormStatus state={state} />
        <Field name="currentPassword" label="رمز فعلی" required error={errors.currentPassword}>
          {(props) => <Input {...props} type="password" dir="ltr" autoComplete="current-password" />}
        </Field>
        <Field name="newPassword" label="رمز جدید" hint="دست‌کم ۱۰ نویسه." required error={errors.newPassword}>
          {(props) => <Input {...props} type="password" dir="ltr" autoComplete="new-password" />}
        </Field>
        <Field name="confirmPassword" label="تکرار رمز جدید" required error={errors.confirmPassword}>
          {(props) => <Input {...props} type="password" dir="ltr" autoComplete="new-password" />}
        </Field>
        <div className="flex justify-end">
          <SubmitButton pending={pending}>تغییر رمز</SubmitButton>
        </div>
      </form>
    </FormSection>
  );
}
