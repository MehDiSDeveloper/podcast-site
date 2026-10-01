"use client";

import { Plus, X } from "lucide-react";
import { useId, useState, type KeyboardEvent } from "react";

import { cn, normalizeFa } from "@/lib/utils";

/**
 * Chip-style tag picker. Suggests existing tags as you type; anything else is
 * submitted as a new name and created by the server on save. Names are compared
 * in normalized form so «كار» picks the existing «کار».
 */
export function TagInput({
  name,
  initial,
  suggestions,
  error,
}: {
  name: string;
  initial: string[];
  suggestions: string[];
  error?: string;
}) {
  const id = useId();
  const [tags, setTags] = useState(initial);
  const [draft, setDraft] = useState("");

  const query = normalizeFa(draft);
  const known = new Set(suggestions);
  const matches = query
    ? suggestions.filter((tag) => tag.includes(query) && !tags.includes(tag)).slice(0, 8)
    : [];

  function add(raw: string) {
    const tag = normalizeFa(raw);
    if (tag && !tags.includes(tag)) setTags([...tags, tag]);
    setDraft("");
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === "," || event.key === "،") {
      // Enter would otherwise submit the whole episode form.
      event.preventDefault();
      add(draft);
    } else if (event.key === "Backspace" && !draft && tags.length > 0) {
      setTags(tags.slice(0, -1));
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {tags.map((tag) => (
        <input key={tag} type="hidden" name={name} value={tag} />
      ))}
      {/* A name typed but not yet confirmed with Enter is still saved. */}
      {query && !tags.includes(query) ? <input type="hidden" name={name} value={query} /> : null}

      {tags.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5" aria-label="برچسب‌های انتخاب‌شده">
          {tags.map((tag) => (
            <li
              key={tag}
              className={cn(
                "inline-flex items-center gap-1 rounded-full py-1 pr-3 pl-1 text-sm",
                known.has(tag) ? "bg-surface-2 text-ink" : "bg-accent-soft text-accent-ink",
              )}
            >
              {tag}
              {known.has(tag) ? null : <span className="text-[0.6875rem] opacity-70">(جدید)</span>}
              <button
                type="button"
                onClick={() => setTags(tags.filter((item) => item !== tag))}
                aria-label={`حذف برچسب ${tag}`}
                className="grid size-5 place-items-center rounded-full hover:bg-ink/10"
              >
                <X className="size-3.5" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <label htmlFor={id} className="sr-only">
        افزودن برچسب
      </label>
      <input
        id={id}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={onKeyDown}
        placeholder="نام برچسب و Enter"
        autoComplete="off"
        aria-invalid={error ? true : undefined}
        className={cn(
          "w-full rounded-lg border bg-surface px-3.5 py-2.5 text-[0.9375rem] placeholder:text-ink-subtle focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15",
          error ? "border-danger" : "border-line-strong",
        )}
      />

      {query ? (
        <ul className="flex flex-wrap gap-1.5" aria-label="پیشنهادها">
          {matches.map((tag) => (
            <li key={tag}>
              <button
                type="button"
                onClick={() => add(tag)}
                className="rounded-full border border-line-strong px-3 py-1 text-sm transition-colors hover:border-brand hover:text-brand-strong"
              >
                {tag}
              </button>
            </li>
          ))}
          {!known.has(query) && !tags.includes(query) ? (
            <li>
              <button
                type="button"
                onClick={() => add(query)}
                className="inline-flex items-center gap-1 rounded-full border border-dashed border-line-strong px-3 py-1 text-sm text-ink-muted transition-colors hover:border-brand hover:text-brand-strong"
              >
                <Plus className="size-3.5" aria-hidden="true" />
                برچسب تازه «{query}»
              </button>
            </li>
          ) : null}
        </ul>
      ) : null}

      {error ? <p className="text-xs font-medium text-danger">{error}</p> : null}
    </div>
  );
}
