"use server";

import { redirect } from "next/navigation";

import { categorySchema, type CategoryInput } from "@/lib/validation/admin";
import { toFieldErrors, type FormState } from "@/lib/validation/episode";
import { deleteCategory, saveCategory } from "@/server/admin/taxonomy";
import { requireUser } from "@/server/auth";
import { revalidatePublicContent } from "@/server/revalidate";

export type CategoryFormState = FormState<keyof CategoryInput>;

export async function saveCategoryAction(_previous: CategoryFormState, formData: FormData): Promise<CategoryFormState> {
  await requireUser();

  const id = String(formData.get("id") ?? "") || undefined;
  const parsed = categorySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      status: "error",
      message: "چند فیلد نیاز به اصلاح دارد.",
      fieldErrors: toFieldErrors<keyof CategoryInput>(parsed.error.issues),
    };
  }

  const result = await saveCategory(parsed.data, id);
  if (!result.ok) {
    return { status: "error", message: result.message, fieldErrors: { [result.field]: result.message } };
  }

  revalidatePublicContent();
  redirect("/admin/categories?saved=1");
}

export async function deleteCategoryAction(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  const result = id ? await deleteCategory(id) : "deleted";
  if (result === "in-use") redirect("/admin/categories?in-use=1");

  revalidatePublicContent();
  redirect("/admin/categories?deleted=1");
}
