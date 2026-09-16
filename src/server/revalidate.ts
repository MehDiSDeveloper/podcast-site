import "server-only";

import { revalidatePath } from "next/cache";

/**
 * Refreshes every public page after content changes.
 *
 * Episodes and topics appear on the home page, listings, topic hubs, related
 * episode lists, the RSS feed and the sitemap. Tracking each dependency
 * individually is fragile; admin edits are rare, so revalidating the whole
 * public tree is both simpler and always correct.
 */
export function revalidatePublicContent() {
  revalidatePath("/", "layout");
  // Route handlers sit outside the layout tree, so they are refreshed explicitly.
  revalidatePath("/feed.xml");
  revalidatePath("/sitemap.xml");
}
