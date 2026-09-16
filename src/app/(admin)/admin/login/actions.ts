"use server";

import { redirect } from "next/navigation";

import { createSession, signIn } from "@/server/auth";

export type LoginState = { error?: string; username?: string };

/** Only allow redirects back into the admin panel — never to another origin. */
function safeNext(value: FormDataEntryValue | null): string {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin";
}

export async function login(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!username.trim() || !password) {
    return { error: "نام کاربری و رمز عبور را وارد کنید.", username };
  }

  const result = await signIn(username, password);

  if (!result.ok) {
    return {
      // One generic message for both "no such user" and "wrong password", so
      // the form cannot be used to discover valid usernames.
      error:
        result.reason === "throttled"
          ? "تلاش‌های ناموفق زیادی ثبت شده است. لطفاً ۱۵ دقیقه بعد دوباره امتحان کنید."
          : "نام کاربری یا رمز عبور نادرست است.",
      username,
    };
  }

  await createSession(result.userId);
  redirect(safeNext(formData.get("next")));
}
