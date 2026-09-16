"use server";

import { revalidatePath } from "next/cache";

import {
  passwordSchema,
  profileSchema,
  type PasswordInput,
  type ProfileInput,
} from "@/lib/validation/admin";
import { toFieldErrors, type FormState } from "@/lib/validation/episode";
import { requireUser, revokeOtherSessions } from "@/server/auth";
import { db } from "@/server/db";
import { hashPassword, verifyPassword } from "@/server/password";

export type ProfileFormState = FormState<keyof ProfileInput>;
export type PasswordFormState = FormState<keyof PasswordInput>;

export async function updateProfileAction(_previous: ProfileFormState, formData: FormData): Promise<ProfileFormState> {
  const user = await requireUser();
  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { status: "error", message: "چند فیلد نیاز به اصلاح دارد.", fieldErrors: toFieldErrors(parsed.error.issues) };
  }

  if (parsed.data.email) {
    const taken = await db.user.findFirst({
      where: { email: parsed.data.email, id: { not: user.id } },
      select: { id: true },
    });
    if (taken) return { status: "error", message: "این ایمیل قبلاً ثبت شده است.", fieldErrors: { email: "ایمیل تکراری است." } };
  }

  await db.user.update({
    where: { id: user.id },
    data: { name: parsed.data.name, email: parsed.data.email ?? null },
  });

  revalidatePath("/admin", "layout");
  return { status: "success", message: "مشخصات به‌روز شد." };
}

export async function changePasswordAction(_previous: PasswordFormState, formData: FormData): Promise<PasswordFormState> {
  const user = await requireUser();
  const parsed = passwordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { status: "error", message: "چند فیلد نیاز به اصلاح دارد.", fieldErrors: toFieldErrors(parsed.error.issues) };
  }

  const record = await db.user.findUnique({ where: { id: user.id }, select: { passwordHash: true } });
  if (!record || !(await verifyPassword(parsed.data.currentPassword, record.passwordHash))) {
    return { status: "error", message: "رمز فعلی نادرست است.", fieldErrors: { currentPassword: "رمز فعلی نادرست است." } };
  }

  await db.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(parsed.data.newPassword) } });
  // A password change should lock out anyone else who might be signed in.
  await revokeOtherSessions(user.id);

  return { status: "success", message: "رمز عبور تغییر کرد و بقیه‌ی نشست‌ها خارج شدند." };
}
