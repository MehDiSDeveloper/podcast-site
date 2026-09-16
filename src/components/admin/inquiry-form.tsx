"use client";

import { updateInquiryAction, type InquiryFormState } from "@/app/(admin)/admin/(panel)/inquiries/actions";
import { FormStatus, SubmitButton, useFormAction } from "@/components/admin/form-parts";
import { Field, Select, Textarea } from "@/components/ui/field";
import { INQUIRY_STATUS_LABELS, INQUIRY_STATUSES } from "@/lib/enums";

export function InquiryForm({ id, status, adminNotes }: { id: string; status: string; adminNotes: string }) {
  const { state, pending, onSubmit } = useFormAction<InquiryFormState>(updateInquiryAction, { status: "idle" });
  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <input type="hidden" name="id" value={id} />
      <FormStatus state={state} />

      <Field name="status" label="وضعیت" required error={errors.status}>
        {(props) => (
          <Select {...props} defaultValue={status} className="max-w-60">
            {INQUIRY_STATUSES.map((value) => (
              <option key={value} value={value}>
                {INQUIRY_STATUS_LABELS[value]}
              </option>
            ))}
          </Select>
        )}
      </Field>

      <Field name="adminNotes" label="یادداشت داخلی" hint="فقط در پنل دیده می‌شود." error={errors.adminNotes}>
        {(props) => <Textarea {...props} rows={5} defaultValue={adminNotes} />}
      </Field>

      <div className="flex justify-end">
        <SubmitButton pending={pending}>ذخیره</SubmitButton>
      </div>
    </form>
  );
}
