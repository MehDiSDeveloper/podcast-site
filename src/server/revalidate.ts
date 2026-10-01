import "server-only";

import { revalidatePath } from "next/cache";

/**
 * Refreshes every public page after content changes.
 *
 * Episodes and their taxonomy appear on the home page, listings, category and
 * tag pages, related
 * episode lists, the RSS feed and the sitemap. Tracking each dependency
 * individually is fragile; admin edits are rare, so revalidating the whole
 * public tree is both simpler and always correct.
 *
 * What this actually clears are the detail pages generated on first request
 * (episode, category, tag) and their OG images. The home page, the category
 * index, the feed and the sitemap are rendered per request — see the note in
 * src/app/(site)/page.tsx — so they need no invalidation.
 */
export function revalidatePublicContent() {
  revalidatePath("/", "layout");
}
