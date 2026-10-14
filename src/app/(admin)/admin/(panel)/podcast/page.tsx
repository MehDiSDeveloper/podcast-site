import type { Metadata } from "next";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { PodcastForm } from "@/components/admin/podcast-form";
import { siteConfig } from "@/config/site";
import { getShow } from "@/server/show";

export const metadata: Metadata = { title: "پادکست" };

export default async function PodcastPage() {
  const show = await getShow();

  return (
    <>
      <AdminPageHeader
        title="پادکست"
        description="توضیح و کاور خود پادکست؛ در سایت و، از طریق فید RSS، در اپ‌های پادکست نمایش داده می‌شود."
      />
      <PodcastForm
        initial={{
          description: show?.description ?? "",
          coverImage: show?.coverImage ?? "",
          coverVideo: show?.coverVideo ?? "",
        }}
        defaultArtwork={siteConfig.podcast.artwork}
      />
    </>
  );
}
