"use client";

import {
  ExternalLink,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  Mic,
  Tags,
  UserCog,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { ThemeToggle } from "@/components/site/theme-toggle";
import { siteConfig } from "@/config/site";
import { cn, toFaDigits } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: LucideIcon; badge?: number; exact?: boolean };

export function AdminShell({
  user,
  newInquiries,
  logoutAction,
  children,
}: {
  user: { name: string; username: string };
  newInquiries: number;
  logoutAction: () => Promise<void>;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  const nav: NavItem[] = [
    { href: "/admin", label: "داشبورد", icon: LayoutDashboard, exact: true },
    { href: "/admin/episodes", label: "اپیزودها", icon: Mic },
    { href: "/admin/topics", label: "موضوع‌ها", icon: Tags },
    { href: "/admin/inquiries", label: "درخواست‌های همکاری", icon: Inbox, badge: newInquiries },
    { href: "/admin/account", label: "حساب کاربری", icon: UserCog },
  ];

  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2.5 border-b border-line px-5">
        <span aria-hidden="true" className="grid size-8 place-items-center rounded-lg bg-brand text-brand-contrast">
          <svg viewBox="0 0 24 24" className="size-4.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <path d="M5 10v4M9.5 6.5v11M14.5 8.5v7M19 10.5v3" />
          </svg>
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-extrabold">{siteConfig.name}</p>
          <p className="text-xs text-ink-subtle">پنل مدیریت</p>
        </div>
      </div>

      <nav aria-label="منوی مدیریت" className="flex-1 overflow-y-auto p-3">
        <ul className="flex flex-col gap-1">
          {nav.map((item) => {
            const active = isActive(item);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    active ? "bg-brand-soft text-brand-strong" : "text-ink-muted hover:bg-surface-2 hover:text-ink",
                  )}
                >
                  <Icon className="size-4.5 shrink-0" aria-hidden="true" />
                  <span className="flex-1">{item.label}</span>
                  {item.badge ? (
                    <span
                      className="nums grid min-w-5 place-items-center rounded-full bg-accent px-1.5 text-[0.6875rem] font-bold leading-5 text-accent-contrast"
                      aria-label={`${toFaDigits(item.badge)} درخواست جدید`}
                    >
                      {toFaDigits(item.badge)}
                    </span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-line p-3">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
        >
          <ExternalLink className="size-4.5" aria-hidden="true" />
          مشاهده‌ی سایت
        </Link>

        <div className="mt-2 flex items-center gap-3 rounded-lg px-3 py-2">
          <div
            aria-hidden="true"
            className="grid size-8 shrink-0 place-items-center rounded-full bg-surface-2 text-sm font-bold text-ink-muted"
          >
            {user.name.slice(0, 1)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{user.name}</p>
            <p className="truncate text-xs text-ink-subtle" dir="ltr">
              @{user.username}
            </p>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              aria-label="خروج از حساب"
              title="خروج"
              className="grid size-8 place-items-center rounded-lg text-ink-subtle transition-colors hover:bg-danger-soft hover:text-danger"
            >
              <LogOut className="size-4 -scale-x-100" aria-hidden="true" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-dvh flex-1">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 border-l border-line bg-surface lg:block">
        {sidebar}
      </aside>

      {/* Mobile drawer */}
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="منوی مدیریت">
          <button
            type="button"
            aria-label="بستن منو"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
          />
          <aside className="absolute inset-y-0 right-0 w-72 max-w-[85vw] bg-surface shadow-lifted">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="بستن منو"
              className="absolute left-3 top-4 z-10 grid size-8 place-items-center rounded-lg text-ink-subtle hover:bg-surface-2"
            >
              <X className="size-4.5" aria-hidden="true" />
            </button>
            {sidebar}
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-3 border-b border-line bg-canvas/85 px-4 backdrop-blur-xl sm:px-6">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="باز کردن منو"
            aria-expanded={open}
            className="grid size-10 place-items-center rounded-lg text-ink-muted hover:bg-surface-2 lg:hidden"
          >
            <Menu className="size-5" aria-hidden="true" />
          </button>
          <div className="flex-1" />
          <ThemeToggle />
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-9">{children}</main>
      </div>
    </div>
  );
}
