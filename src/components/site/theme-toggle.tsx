"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";

import { cn } from "@/lib/utils";

/**
 * The theme class is applied before paint by ThemeScript. This component treats
 * that class on <html> as an external store, so it stays in sync even if the
 * theme is changed elsewhere (another toggle, devtools).
 */
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}

const getIsDark = () => document.documentElement.classList.contains("dark");

export function ThemeToggle({ className }: { className?: string }) {
  // null on the server: the real theme is unknown until the browser runs.
  const isDark = useSyncExternalStore<boolean | null>(subscribe, getIsDark, () => null);

  function toggle() {
    const next = !getIsDark();
    document.documentElement.classList.toggle("dark", next);
    document.documentElement.style.colorScheme = next ? "dark" : "light";
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      // Private browsing can block storage; the toggle still works this session.
    }
  }

  const label = isDark ? "روشن کردن پوسته" : "تیره کردن پوسته";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className={cn(
        "grid size-10 place-items-center rounded-lg text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink",
        className,
      )}
    >
      {isDark === null ? (
        <Sun className="size-5 opacity-0" aria-hidden="true" />
      ) : isDark ? (
        <Sun className="size-5" aria-hidden="true" />
      ) : (
        <Moon className="size-5" aria-hidden="true" />
      )}
    </button>
  );
}
