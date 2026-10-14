import { Rss } from "lucide-react";
import Link from "next/link";

import { mainNav, siteConfig } from "@/config/site";

const socialLabels: Record<string, string> = {
  linkedin: "لینکدین",
  instagram: "اینستاگرام",
  youtube: "یوتیوب",
  x: "ایکس",
  telegram: "تلگرام",
};

export function Footer() {
  const socials = Object.entries(siteConfig.social).filter(([, url]) => url);
  const year = new Intl.DateTimeFormat("fa-IR", { year: "numeric" }).format(new Date());

  return (
    <footer className="glass-bar mt-auto border-t border-line">
      <div className="container-page grid gap-10 py-14 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <p className="text-lg font-extrabold">{siteConfig.name}</p>
          <a
            href="/feed.xml"
            className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-ink-muted transition-colors hover:text-brand-strong"
          >
            <Rss className="size-4" aria-hidden="true" />
            فید RSS پادکست
          </a>
        </div>

        <nav aria-label="پیوندهای سایت">
          <h2 className="text-sm font-bold text-ink">صفحه‌ها</h2>
          <ul className="mt-4 flex flex-col gap-3 text-sm">
            {mainNav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-ink-muted transition-colors hover:text-brand-strong">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="text-sm font-bold text-ink">ارتباط</h2>
          <ul className="mt-4 flex flex-col gap-3 text-sm">
            <li>
              <a
                href={`mailto:${siteConfig.author.email}`}
                className="text-ink-muted transition-colors hover:text-brand-strong"
              >
                {siteConfig.author.email}
              </a>
            </li>
            {socials.map(([key, url]) => (
              <li key={key}>
                <a
                  href={url}
                  target="_blank"
                  rel="me noopener noreferrer"
                  className="text-ink-muted transition-colors hover:text-brand-strong"
                >
                  {socialLabels[key] ?? key}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-6 text-xs text-ink-subtle sm:flex-row">
          <p>
            © {year} {siteConfig.name}. همه‌ی حقوق محفوظ است.
          </p>
          <p>
            ساخته شده توسط{" "}
            <a
              href="https://geekware.ir"
              target="_blank"
              rel="noopener"
              className="font-semibold transition-colors hover:text-brand-strong"
            >
              GeekWare.ir
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
