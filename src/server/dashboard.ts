import "server-only";

import { db } from "./db";

export async function getDashboardData() {
  const now = new Date();

  const [published, drafts, scheduled, newInquiries, totalInquiries, plays, recentInquiries, topEpisodes] =
    await Promise.all([
      db.episode.count({ where: { status: "PUBLISHED", publishedAt: { lte: now } } }),
      db.episode.count({ where: { status: "DRAFT" } }),
      db.episode.count({
        where: { OR: [{ status: "SCHEDULED" }, { status: "PUBLISHED", publishedAt: { gt: now } }] },
      }),
      db.inquiry.count({ where: { status: "NEW" } }),
      db.inquiry.count(),
      db.episode.aggregate({ _sum: { playCount: true } }),
      db.inquiry.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, name: true, company: true, collaborationType: true, status: true, createdAt: true },
      }),
      db.episode.findMany({
        where: { status: "PUBLISHED" },
        orderBy: [{ playCount: "desc" }, { publishedAt: "desc" }],
        take: 5,
        select: { id: true, title: true, playCount: true, episodeNumber: true },
      }),
    ]);

  return {
    stats: {
      published,
      drafts,
      scheduled,
      newInquiries,
      totalInquiries,
      totalPlays: plays._sum.playCount ?? 0,
    },
    recentInquiries,
    topEpisodes,
  };
}
