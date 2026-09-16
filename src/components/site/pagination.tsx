import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

import { cn, toFaDigits } from "@/lib/utils";

/**
 * Link-based pagination so every page is crawlable and works without JS.
 * `buildHref` lets the caller keep the current filters in the query string.
 */
export function Pagination({
  page,
  pageCount,
  buildHref,
}: {
  page: number;
  pageCount: number;
  buildHref: (page: number) => string;
}) {
  if (pageCount <= 1) return null;

  const pages = pageNumbers(page, pageCount);

  return (
    <nav aria-label="صفحه‌بندی" className="mt-14 flex items-center justify-center gap-1.5">
      <PageLink
        href={buildHref(page - 1)}
        disabled={page <= 1}
        aria-label="صفحه‌ی قبل"
        className="px-3"
      >
        {/* In RTL, "previous" points to the right. */}
        <ChevronRight className="size-4" aria-hidden="true" />
      </PageLink>

      {pages.map((entry, index) =>
        entry === "gap" ? (
          <span key={`gap-${index}`} className="px-1 text-ink-subtle" aria-hidden="true">
            …
          </span>
        ) : (
          <PageLink
            key={entry}
            href={buildHref(entry)}
            active={entry === page}
            aria-label={`صفحه‌ی ${toFaDigits(entry)}`}
            aria-current={entry === page ? "page" : undefined}
          >
            <span className="nums">{toFaDigits(entry)}</span>
          </PageLink>
        ),
      )}

      <PageLink href={buildHref(page + 1)} disabled={page >= pageCount} aria-label="صفحه‌ی بعد" className="px-3">
        <ChevronLeft className="size-4" aria-hidden="true" />
      </PageLink>
    </nav>
  );
}

function PageLink({
  href,
  active,
  disabled,
  className,
  children,
  ...props
}: {
  href: string;
  active?: boolean;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
} & React.ComponentProps<"a">) {
  const styles = cn(
    "inline-grid h-10 min-w-10 place-items-center rounded-lg border text-sm font-semibold transition-colors",
    active
      ? "border-brand bg-brand text-brand-contrast"
      : "border-line bg-surface text-ink-muted hover:border-line-strong hover:text-ink",
    className,
  );

  if (disabled) {
    return (
      <span aria-disabled="true" className={cn(styles, "pointer-events-none opacity-40")} {...props}>
        {children}
      </span>
    );
  }

  return (
    <Link href={href} className={styles} {...props}>
      {children}
    </Link>
  );
}

/** Windowed page list: 1 … 4 [5] 6 … 20 */
function pageNumbers(page: number, pageCount: number): (number | "gap")[] {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1);

  const result: (number | "gap")[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(pageCount - 1, page + 1);

  if (start > 2) result.push("gap");
  for (let i = start; i <= end; i += 1) result.push(i);
  if (end < pageCount - 1) result.push("gap");

  result.push(pageCount);
  return result;
}
