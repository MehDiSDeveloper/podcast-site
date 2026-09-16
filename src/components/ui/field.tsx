import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

const control =
  "w-full rounded-lg border bg-surface px-3.5 py-2.5 text-[0.9375rem] text-ink " +
  "placeholder:text-ink-subtle transition-colors duration-200 " +
  "focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15 " +
  "disabled:cursor-not-allowed disabled:opacity-60";

/**
 * Wraps a control with its label, hint and error message, and wires up the
 * `aria-describedby` / `aria-invalid` relationships that screen readers need.
 *
 * Children receive the generated ids through a render prop so the markup stays
 * explicit rather than relying on cloneElement.
 */
export function Field({
  name,
  label,
  hint,
  error,
  required,
  className,
  children,
}: {
  name: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: (props: {
    id: string;
    name: string;
    "aria-describedby": string | undefined;
    "aria-invalid": boolean | undefined;
    "aria-required": boolean | undefined;
  }) => ReactNode;
}) {
  const hintId = hint ? `${name}-hint` : undefined;
  const errorId = error ? `${name}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={name} className="text-sm font-semibold text-ink">
        {label}
        {required ? (
          <span className="text-danger" aria-hidden="true">
            {" *"}
          </span>
        ) : (
          <span className="mr-1.5 text-xs font-normal text-ink-subtle">(اختیاری)</span>
        )}
      </label>

      {hint ? (
        <p id={hintId} className="text-xs text-ink-subtle">
          {hint}
        </p>
      ) : null}

      {children({
        id: name,
        name,
        "aria-describedby": describedBy,
        "aria-invalid": error ? true : undefined,
        "aria-required": required || undefined,
      })}

      {error ? (
        <p id={errorId} className="text-xs font-medium text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(control, props["aria-invalid"] ? "border-danger" : "border-line-strong", className)}
      {...props}
    />
  );
}

export function Textarea({ className, rows = 5, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      rows={rows}
      className={cn(
        control,
        "resize-y leading-loose",
        props["aria-invalid"] ? "border-danger" : "border-line-strong",
        className,
      )}
      {...props}
    />
  );
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        control,
        "cursor-pointer appearance-none bg-[length:1.1em] bg-no-repeat pl-10",
        // Inline chevron so the control does not depend on an icon component.
        "bg-[image:url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 fill=%22none%22 stroke=%22%23888%22 stroke-width=%222%22 viewBox=%220 0 24 24%22><path d=%22m6 9 6 6 6-6%22/></svg>')]",
        "bg-[position:left_0.75rem_center]",
        props["aria-invalid"] ? "border-danger" : "border-line-strong",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}
