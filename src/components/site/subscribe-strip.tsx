import { Rss } from "lucide-react";
import Link from "next/link";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

const directoryLabels: Record<keyof typeof siteConfig.listenOn, string> = {
  spotify: "اسپاتیفای",
  applePodcasts: "اپل پادکست",
  googlePodcasts: "گوگل پادکست",
  castbox: "کست‌باکس",
  shenoto: "شنوتو",
};

/**
 * Where to subscribe. Directories with an empty URL in site config are hidden,
 * so the strip degrades to just the RSS link on a fresh install.
 */
export function SubscribeStrip({ className }: { className?: string }) {
  const directories = (Object.keys(directoryLabels) as (keyof typeof siteConfig.listenOn)[])
    .map((key) => ({ key, label: directoryLabels[key], url: siteConfig.listenOn[key] }))
    .filter((entry) => entry.url);

  return (
    <div className={cn("rounded-2xl border border-line bg-surface p-6", className)}>
      <h2 className="text-lg font-bold">شنیدن در اپلیکیشن دلخواه‌تان</h2>
      <p className="mt-2 text-sm leading-loose text-ink-muted">
        اپیزود تازه را همان‌جایی بشنوید که همیشه پادکست گوش می‌دهید.
      </p>

      <ul className="mt-5 flex flex-wrap gap-2">
        {directories.map((directory) => (
          <li key={directory.key}>
            <a
              href={directory.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-lg border border-line bg-canvas px-3.5 py-2 text-sm font-medium transition-colors hover:border-brand hover:text-brand-strong"
            >
              {directory.label}
            </a>
          </li>
        ))}
        <li>
          <Link
            href="/feed.xml"
            className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-canvas px-3.5 py-2 text-sm font-medium transition-colors hover:border-brand hover:text-brand-strong"
          >
            <Rss className="size-4" aria-hidden="true" />
            RSS
          </Link>
        </li>
      </ul>
    </div>
  );
}
