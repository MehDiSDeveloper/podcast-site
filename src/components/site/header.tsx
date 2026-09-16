"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { ThemeToggle } from "@/components/site/theme-toggle";
import { buttonStyles } from "@/components/ui/button";
import { mainNav, siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Close the mobile sheet on navigation, otherwise it stays open over the new
  // page. Adjusting state during render avoids an extra effect-driven pass.
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setOpen(false);
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Prevent the page behind the sheet from scrolling while it is open.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b transition-colors duration-300",
        scrolled
          ? "border-line bg-canvas/85 backdrop-blur-xl supports-[backdrop-filter]:bg-canvas/75"
          : "border-transparent bg-canvas",
      )}
    >
      <div className="container-page flex h-18 items-center justify-between gap-4">
        <Link
          href="/"
          className="group flex items-center gap-2.5 rounded-lg text-lg font-extrabold tracking-tight"
        >
          <span
            aria-hidden="true"
            className="grid size-9 place-items-center rounded-lg bg-brand text-brand-contrast transition-transform duration-300 group-hover:rotate-[-8deg]"
          >
            {/* Sound-wave mark, drawn inline so the logo needs no asset. */}
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M5 10v4M9.5 6.5v11M14.5 8.5v7M19 10.5v3" />
            </svg>
          </span>
          {siteConfig.name}
        </Link>

        <nav aria-label="فهرست اصلی" className="hidden items-center gap-1 md:flex">
          {mainNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={cn(
                "relative rounded-lg px-3.5 py-2 text-[0.9375rem] font-medium transition-colors",
                isActive(item.href) ? "text-brand-strong" : "text-ink-muted hover:text-ink",
              )}
            >
              {item.label}
              {isActive(item.href) ? (
                <span className="absolute inset-x-3.5 -bottom-px h-0.5 rounded-full bg-brand" aria-hidden="true" />
              ) : null}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <Link href="/contact" className={buttonStyles({ size: "sm", className: "hidden sm:inline-flex" })}>
            دعوت به همکاری
          </Link>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "بستن فهرست" : "باز کردن فهرست"}
            className="grid size-10 place-items-center rounded-lg text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink md:hidden"
          >
            {open ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* Mobile sheet */}
      <div
        id="mobile-nav"
        hidden={!open}
        className="border-t border-line bg-canvas md:hidden"
      >
        <nav aria-label="فهرست موبایل" className="container-page flex flex-col gap-1 py-4">
          {mainNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={cn(
                "rounded-lg px-3 py-3 text-base font-medium transition-colors",
                isActive(item.href) ? "bg-brand-soft text-brand-strong" : "text-ink-muted hover:bg-surface-2",
              )}
            >
              {item.label}
            </Link>
          ))}
          <Link href="/contact" className={buttonStyles({ className: "mt-2 w-full" })}>
            دعوت به همکاری
          </Link>
        </nav>
      </div>
    </header>
  );
}
