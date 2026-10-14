"use server";

import { showSchema, type ShowInput } from "@/lib/validation/admin";
import { toFieldErrors, type FormState } from "@/lib/validation/episode";
import { requireUser } from "@/server/auth";
import { revalidatePublicContent } from "@/server/revalidate";
import { getShow, updateShow } from "@/server/show";
import { deleteUpload } from "@/server/uploads";

export type PodcastFormState = FormState<keyof ShowInput>;

export async function savePodcastAction(_previous: PodcastFormState, formData: FormData): Promise<PodcastFormState> {
  await requireUser();

  const parsed = showSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { status: "error", message: "چند فیلد نیاز به اصلاح دارد.", fieldErrors: toFieldErrors(parsed.error.issues) };
  }

  try {
    const previous = await getShow();
    const show = await updateShow(parsed.data);

    // Clean up files the show no longer references.
    if (previous?.coverImage !== show.coverImage) await deleteUpload(previous?.coverImage);
    if (previous?.coverVideo !== show.coverVideo) await deleteUpload(previous?.coverVideo);
  } catch (error) {
    console.error("[admin] save podcast failed:", error);
    return { status: "error", message: "ذخیره ناموفق بود. دوباره تلاش کنید." };
  }

  revalidatePublicContent();
  return { status: "success", message: "ذخیره شد. اپ‌های پادکست در به‌روزرسانی بعدی فید، تغییر را می‌گیرند." };
}
