import type { Metadata } from "next";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { EpisodeForm, type EpisodeFormValues } from "@/components/admin/episode-form";
import { db } from "@/server/db";
import { getEpisodeFormOptions } from "@/server/taxonomy";

export const metadata: Metadata = { title: "اپیزود جدید" };

export default async function NewEpisodePage() {
  const [options, last] = await Promise.all([
    getEpisodeFormOptions(),
    db.episode.findFirst({ orderBy: { episodeNumber: "desc" }, select: { episodeNumber: true } }),
  ]);

  const initial: EpisodeFormValues = {
    title: "",
    slug: "",
    subtitle: "",
    description: "",
    showNotes: "",
    transcript: "",
    audioUrl: "",
    audioSizeBytes: 0,
    audioMimeType: "audio/mpeg",
    durationSeconds: 0,
    coverImage: "",
    // Suggest the next number so a routine publish needs one less field.
    episodeNumber: (last?.episodeNumber ?? 0) + 1,
    seasonNumber: null,
    episodeType: "full",
    status: "DRAFT",
    publishedAt: null,
    featured: false,
    explicit: false,
    categoryId: "",
    lensIds: [],
    tags: [],
    seoTitle: "",
    seoDescription: "",
  };

  return (
    <>
      <AdminPageHeader title="اپیزود جدید" description="تا وقتی وضعیت «منتشرشده» نباشد، اپیزود در سایت دیده نمی‌شود." />
      <EpisodeForm initial={initial} options={options} />
    </>
  );
}
