import { notFound } from "next/navigation";

/**
 * Catch-all for URLs no other route claims. Routing them through the (site)
 * group means a typo still gets the branded 404 with header and footer, instead
 * of the bare root-level fallback. Every more specific route wins over this one.
 *
 * No metadata export here: Next discards a page's metadata once it calls
 * notFound(), and injects `noindex` on the 404 response itself.
 */
export default function Unmatched() {
  notFound();
}
