import "server-only";

import { cache } from "react";

import { showCover } from "@/lib/cover";

import { db } from "./db";

/** The default show row: the RSS channel. `cache` dedupes it within a request. */
export const getShow = cache(() => db.show.findFirst({ where: { isDefault: true } }));

export const getShowCover = cache(async () => showCover(await getShow()));

export async function updateShow(data: { description: string; coverImage: string | null; coverVideo: string | null }) {
  const show = await getShow();
  if (!show) throw new Error("Default show is missing; restart the server to run bootstrap.");
  return db.show.update({ where: { id: show.id }, data });
}
