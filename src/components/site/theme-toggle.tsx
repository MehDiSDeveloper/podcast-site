"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * The initial class is applied before paint by ThemeScript, so this component
 * only mirrors it into React state after mount. Rendering a neutral icon until
 * then avoids a hydration mismatch against the pre-paint choice.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const [isDark, setIsDark] = useState<boolean | null>(null);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    document.documentElement.style.colorScheme = next ? "dark" : "light";
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      // Private browsing can block storage; the toggle still works this session.
    }
    setIsDark(next);
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
