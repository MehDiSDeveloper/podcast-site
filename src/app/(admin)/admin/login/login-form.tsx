"use client";

import { Eye, EyeOff, LogIn } from "lucide-react";
import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

import { login, type LoginState } from "./actions";

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(login, {});
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {next ? <input type="hidden" name="next" value={next} /> : null}

      {state.error ? (
        <div
          role="alert"
          className="rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm font-medium text-danger"
        >
          {state.error}
        </div>
      ) : null}

      <Field name="username" label="نام کاربری" required>
        {(props) => (
          <Input
            {...props}
            dir="ltr"
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            autoFocus
            defaultValue={state.username}
          />
        )}
      </Field>

      <Field name="password" label="رمز عبور" required>
        {(props) => (
          <div className="relative">
            <Input
              {...props}
              type={showPassword ? "text" : "password"}
              dir="ltr"
              autoComplete="current-password"
              className="pl-11"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? "پنهان کردن رمز عبور" : "نمایش رمز عبور"}
              aria-pressed={showPassword}
              className="absolute inset-y-0 left-0 grid w-11 place-items-center text-ink-subtle transition-colors hover:text-ink"
            >
              {showPassword ? <EyeOff className="size-4.5" aria-hidden="true" /> : <Eye className="size-4.5" aria-hidden="true" />}
            </button>
          </div>
        )}
      </Field>

      <Button type="submit" size="lg" disabled={pending} className="mt-2 w-full">
        {pending ? (
          <>
            <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
            در حال ورود…
          </>
        ) : (
          <>
            <LogIn className="size-4 -scale-x-100" aria-hidden="true" />
            ورود به پنل
          </>
        )}
      </Button>
    </form>
  );
}
