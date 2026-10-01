import { ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { EpisodeForm } from "@/components/admin/episode-form";
import { DeleteButton } from "@/components/admin/form-parts";
import { buttonStyles } from "@/components/ui/button";
import { getAdminEpisode } from "@/server/admin/episodes";
import { getEpisodeFormOptions } from "@/server/taxonomy";

import { deleteEpisodeAction } from "../actions";

export const metadata: Metadata = { title: "ویرایش اپیزود" };

export default async function EditEpisodePage({ params, searchParams }: PageProps<"/admin/episodes/[id]">) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const [episode, options] = await Promise.all([getAdminEpisode(id), getEpisodeFormOptions()]);

  if (!episode) notFound();

  return (
    <>
      <AdminPageHeader
        title={episode.title}
        description="ویرایش اپیزود"
        actions={
          <>
            {episode.status === "PUBLISHED" ? (
              <Link href={`/episodes/${episode.slug}`} target="_blank" className={buttonStyles({ variant: "outline", size: "sm" })}>
                <ExternalLink className="size-4" aria-hidden="true" />
                مشاهده در سایت
              </Link>
            ) : null}
            <DeleteButton
              action={deleteEpisodeAction}
              id={episode.id}
              confirmMessage={`«${episode.title}» برای همیشه حذف شود؟ این کار قابل بازگشت نیست.`}
            />
          </>
        }
      />

      {query.created ? (
        <p role="status" className="mb-6 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm font-medium text-success">
          اپیزود ساخته شد.
        </p>
      ) : null}

      <EpisodeForm
        options={options}
        initial={{
          id: episode.id,
          title: episode.title,
          slug: episode.slug,
          subtitle: episode.subtitle ?? "",
          description: episode.description,
          showNotes: episode.showNotes ?? "",
          transcript: episode.transcript ?? "",
          audioUrl: episode.audioUrl,
          audioSizeBytes: episode.audioSizeBytes,
          audioMimeType: episode.audioMimeType,
          durationSeconds: episode.durationSeconds,
          coverImage: episode.coverImage ?? "",
          episodeNumber: episode.episodeNumber,
          seasonNumber: episode.seasonNumber,
          episodeType: episode.episodeType,
          status: episode.status,
          publishedAt: episode.publishedAt?.toISOString() ?? null,
          featured: episode.featured,
          explicit: episode.explicit,
          categoryId: episode.categoryId ?? "",
          lensIds: episode.lenses.map((link) => link.lensId),
          tags: episode.tags.map((link) => link.tag.name),
          seoTitle: episode.seoTitle ?? "",
          seoDescription: episode.seoDescription ?? "",
        }}
      />
    </>
  );
}
