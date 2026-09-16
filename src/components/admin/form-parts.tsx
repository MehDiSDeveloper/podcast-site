"use client";

import { CheckCircle2, Trash2 } from "lucide-react";
import { startTransition, useActionState, type FormEvent, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * useActionState with manual dispatch. Passing the action to <form action>
 * makes React 19 reset every uncontrolled field once it settles — including
 * after a validation error, which would wipe what the admin just typed.
 */
export function useFormAction<State>(
  action: (state: Awaited<State>, formData: FormData) => State | Promise<State>,
  initial: Awaited<State>,
) {
  const [state, dispatch, pending] = useActionState<State, FormData>(action, initial);
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => dispatch(formData));
  };
  return { state, pending, onSubmit };
}

/** A titled card that groups related fields in admin forms. */
export function FormSection({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-2xl border border-line bg-surface p-5 sm:p-6", className)}>
      <h2 className="text-base font-bold">{title}</h2>
      {description ? <p className="mt-1 text-sm text-ink-muted">{description}</p> : null}
      <div className="mt-5 flex flex-col gap-5">{children}</div>
    </section>
  );
}

/** Result banner for a form action, announced to screen readers. */
export function FormStatus({ state }: { state: { status: string; message?: string } }) {
  if (state.status === "idle" || !state.message) return null;
  const success = state.status === "success";

  return (
    <div
      role={success ? "status" : "alert"}
      className={cn(
        "flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium",
        success ? "border-success/30 bg-success/10 text-success" : "border-danger/30 bg-danger-soft text-danger",
      )}
    >
      {success ? <CheckCircle2 className="size-4.5 shrink-0" aria-hidden="true" /> : null}
      {state.message}
    </div>
  );
}

export function SubmitButton({ pending, children }: { pending: boolean; children: ReactNode }) {
  return (
    <Button type="submit" disabled={pending} className="min-w-32">
      {pending ? (
        <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
      ) : null}
      {pending ? "در حال ذخیره…" : children}
    </Button>
  );
}

/**
 * Delete control backed by a server action. Asks for confirmation first, since
 * deleting content cannot be undone from the panel.
 */
export function DeleteButton({
  action,
  id,
  confirmMessage,
  label = "حذف",
}: {
  action: (formData: FormData) => Promise<void>;
  id: string;
  confirmMessage: string;
  label?: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm(confirmMessage)) event.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Button type="submit" variant="ghost" size="sm" className="text-danger hover:bg-danger-soft hover:text-danger">
        <Trash2 className="size-4" aria-hidden="true" />
        {label}
      </Button>
    </form>
  );
}

export function Checkbox({ name, label, defaultChecked, hint }: { name: string; label: string; defaultChecked?: boolean; hint?: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="mt-1 size-4 shrink-0 accent-[var(--brand)]"
      />
      <span>
        <span className="text-sm font-semibold">{label}</span>
        {hint ? <span className="block text-xs text-ink-subtle">{hint}</span> : null}
      </span>
    </label>
  );
}
