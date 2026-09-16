import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { siteConfig } from "@/config/site";
import { getCurrentUser } from "@/server/auth";

import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "ورود" };

export default async function LoginPage({ searchParams }: PageProps<"/admin/login">) {
  // Already signed in? Skip the form.
  if (await getCurrentUser()) redirect("/admin");

  const { next } = await searchParams;

  return (
    <main className="flex flex-1 items-center justify-center px-5 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <span
            aria-hidden="true"
            className="grid size-12 place-items-center rounded-xl bg-brand text-brand-contrast shadow-card"
          >
            <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M5 10v4M9.5 6.5v11M14.5 8.5v7M19 10.5v3" />
            </svg>
          </span>
          <h1 className="mt-5 text-2xl">ورود به پنل مدیریت</h1>
          <p className="mt-2 text-sm text-ink-muted">{siteConfig.name}</p>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-6 shadow-card sm:p-7">
          <LoginForm next={typeof next === "string" ? next : undefined} />
        </div>

        <p className="mt-6 text-center text-sm">
          <Link href="/" className="text-ink-subtle transition-colors hover:text-brand-strong">
            بازگشت به سایت
          </Link>
        </p>
      </div>
    </main>
  );
}
