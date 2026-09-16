import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Consistent page opener: eyebrow, title, lead paragraph. */
export function PageHeader({
  eyebrow,
  title,
  lead,
  children,
  className,
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("border-b border-line bg-surface", className)}>
      <div className="container-page py-14 md:py-20">
        {eyebrow ? (
          <p className="text-sm font-bold tracking-wide text-brand-strong">{eyebrow}</p>
        ) : null}
        <h1 className="mt-3 max-w-3xl text-4xl leading-tight md:text-5xl">{title}</h1>
        {lead ? <p className="mt-5 max-w-2xl text-lg leading-loose text-ink-muted">{lead}</p> : null}
        {children}
      </div>
    </div>
  );
}

/** Section opener used inside pages, with an optional trailing action. */
export function SectionHeading({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-4", className)}>
      <div>
        <h2 className="text-2xl md:text-3xl">{title}</h2>
        {description ? <p className="mt-2 max-w-xl text-ink-muted">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
