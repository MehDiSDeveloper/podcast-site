"use server";

import { redirect } from "next/navigation";

import type { TermFormState } from "@/components/admin/term-form";
import { tagSchema } from "@/lib/validation/admin";
import { toFieldErrors } from "@/lib/validation/episode";
import { deleteTag, saveTag } from "@/server/admin/taxonomy";
import { requireUser } from "@/server/auth";
import { revalidatePublicContent } from "@/server/revalidate";

export async function saveTagAction(_previous: TermFormState, formData: FormData): Promise<TermFormState> {
  await requireUser();

  const id = String(formData.get("id") ?? "") || undefined;
  const parsed = tagSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { status: "error", message: "چند فیلد نیاز به اصلاح دارد.", fieldErrors: toFieldErrors(parsed.error.issues) };
  }

  const result = await saveTag(parsed.data, id);
  if (!result.ok) {
    return { status: "error", message: result.message, fieldErrors: { [result.field]: result.message } };
  }

  revalidatePublicContent();
  redirect("/admin/tags?saved=1");
}

export async function deleteTagAction(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  // Episode links cascade; the episodes themselves are untouched.
  if (id) await deleteTag(id);
  revalidatePublicContent();
  redirect("/admin/tags?deleted=1");
}
