"use server";

import { redirect } from "next/navigation";

import { episodeSchema, toFieldErrors, type EpisodeInput, type FormState } from "@/lib/validation/episode";
import { deleteEpisode, getAdminEpisode, saveEpisode } from "@/server/admin/episodes";
import { categoryExists } from "@/server/admin/taxonomy";
import { requireUser } from "@/server/auth";
import { revalidatePublicContent } from "@/server/revalidate";
import { deleteUpload } from "@/server/uploads";

export type EpisodeFormState = FormState<keyof EpisodeInput>;

export async function saveEpisodeAction(_previous: EpisodeFormState, formData: FormData): Promise<EpisodeFormState> {
  await requireUser();

  const id = String(formData.get("id") ?? "") || undefined;
  const listKeys = ["lensIds", "tags"];
  const raw = Object.fromEntries(
    [...formData.keys()].filter((key) => !listKeys.includes(key)).map((key) => [key, formData.get(key)?.toString()]),
  );
  const parsed = episodeSchema.safeParse({
    ...raw,
    lensIds: formData.getAll("lensIds").map(String),
    tags: formData.getAll("tags").map(String),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "چند فیلد نیاز به اصلاح دارد.",
      fieldErrors: toFieldErrors<keyof EpisodeInput>(parsed.error.issues),
    };
  }

  if (parsed.data.categoryId && !(await categoryExists(parsed.data.categoryId))) {
    return {
      status: "error",
      message: "چند فیلد نیاز به اصلاح دارد.",
      fieldErrors: { categoryId: "این دسته دیگر وجود ندارد." },
    };
  }

  let savedId: string;
  try {
    const previous = id ? await getAdminEpisode(id) : null;
    const episode = await saveEpisode(parsed.data, id);
    savedId = episode.id;

    // Clean up files this episode no longer references.
    if (previous?.audioUrl !== episode.audioUrl) await deleteUpload(previous?.audioUrl);
    if (previous?.coverImage !== episode.coverImage) await deleteUpload(previous?.coverImage);
  } catch (error) {
    console.error("[admin] save episode failed:", error);
    return { status: "error", message: "ذخیره‌ی اپیزود ناموفق بود. دوباره تلاش کنید." };
  }

  revalidatePublicContent();

  if (!id) redirect(`/admin/episodes/${savedId}?created=1`);
  return { status: "success", message: "تغییرات ذخیره شد." };
}

export async function deleteEpisodeAction(formData: FormData) {
  await requireUser();

  const id = String(formData.get("id") ?? "");
  const episode = id ? await getAdminEpisode(id) : null;

  if (episode) {
    await deleteEpisode(episode.id);
    await deleteUpload(episode.audioUrl);
    await deleteUpload(episode.coverImage);
    revalidatePublicContent();
  }

  redirect("/admin/episodes?deleted=1");
}
