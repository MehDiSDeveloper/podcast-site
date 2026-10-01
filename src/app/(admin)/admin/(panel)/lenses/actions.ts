"use server";

import { redirect } from "next/navigation";

import type { TermFormState } from "@/components/admin/term-form";
import { lensSchema } from "@/lib/validation/admin";
import { toFieldErrors } from "@/lib/validation/episode";
import { deleteLens, saveLens } from "@/server/admin/taxonomy";
import { requireUser } from "@/server/auth";
import { revalidatePublicContent } from "@/server/revalidate";

export async function saveLensAction(_previous: TermFormState, formData: FormData): Promise<TermFormState> {
  await requireUser();

  const id = String(formData.get("id") ?? "") || undefined;
  const parsed = lensSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { status: "error", message: "چند فیلد نیاز به اصلاح دارد.", fieldErrors: toFieldErrors(parsed.error.issues) };
  }

  const result = await saveLens(parsed.data, id);
  if (!result.ok) {
    return { status: "error", message: result.message, fieldErrors: { [result.field]: result.message } };
  }

  revalidatePublicContent();
  redirect("/admin/lenses?saved=1");
}

export async function deleteLensAction(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  if (id) await deleteLens(id);
  revalidatePublicContent();
  redirect("/admin/lenses?deleted=1");
}
