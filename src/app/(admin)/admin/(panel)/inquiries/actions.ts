"use server";

import { revalidatePath } from "next/cache";

import { inquiryUpdateSchema, type InquiryUpdateInput } from "@/lib/validation/admin";
import { toFieldErrors, type FormState } from "@/lib/validation/episode";
import { requireUser } from "@/server/auth";
import { db } from "@/server/db";
import { setInquiryStarred } from "@/server/inquiries";

export type InquiryFormState = FormState<keyof InquiryUpdateInput>;

export async function updateInquiryAction(_previous: InquiryFormState, formData: FormData): Promise<InquiryFormState> {
  await requireUser();

  const id = String(formData.get("id") ?? "");
  const parsed = inquiryUpdateSchema.safeParse(Object.fromEntries(formData));
  if (!id || !parsed.success) {
    return {
      status: "error",
      message: "اطلاعات ارسالی معتبر نیست.",
      fieldErrors: parsed.success ? undefined : toFieldErrors<keyof InquiryUpdateInput>(parsed.error.issues),
    };
  }

  await db.inquiry.update({
    where: { id },
    data: { status: parsed.data.status, adminNotes: parsed.data.adminNotes ?? null },
  });

  // The sidebar badge counts NEW inquiries, so the whole panel is refreshed.
  revalidatePath("/admin", "layout");
  return { status: "success", message: "ذخیره شد." };
}

export async function setInquiryStarredAction(id: string, starred: boolean): Promise<void> {
  await requireUser();
  await setInquiryStarred(id, starred);
  revalidatePath("/admin/inquiries", "layout");
}
