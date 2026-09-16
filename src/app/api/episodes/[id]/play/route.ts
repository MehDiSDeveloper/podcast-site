import { db } from "@/server/db";

/**
 * Counts a play. The player calls this once per episode per browser session,
 * so the number is a popularity signal for the dashboard, not precise analytics.
 */
export async function POST(_request: Request, { params }: RouteContext<"/api/episodes/[id]/play">) {
  const { id } = await params;
  const { count } = await db.episode.updateMany({
    where: { id, status: "PUBLISHED" },
    data: { playCount: { increment: 1 } },
  });
  return new Response(null, { status: count ? 204 : 404 });
}
