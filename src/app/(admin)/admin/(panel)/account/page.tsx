import type { Metadata } from "next";

import { PasswordForm, ProfileForm } from "@/components/admin/account-forms";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { formatDate, toFaDigits } from "@/lib/utils";
import { requireUser } from "@/server/auth";
import { db } from "@/server/db";

export const metadata: Metadata = { title: "حساب کاربری" };

export default async function AccountPage() {
  const user = await requireUser();
  const [sessions, record] = await Promise.all([
    db.session.count({ where: { userId: user.id, expiresAt: { gt: new Date() } } }),
    db.user.findUnique({ where: { id: user.id }, select: { lastLoginAt: true } }),
  ]);

  const syncedFromEnv =
    (process.env.ADMIN_SYNC_PASSWORD ?? "true") !== "false" &&
    process.env.ADMIN_USERNAME?.trim().toLowerCase() === user.username;

  return (
    <>
      <AdminPageHeader
        title="حساب کاربری"
        description={`@${user.username} · ${toFaDigits(sessions)} نشست فعال${
          record?.lastLoginAt ? ` · آخرین ورود ${formatDate(record.lastLoginAt)}` : ""
        }`}
      />
      <div className="grid max-w-5xl gap-6 lg:grid-cols-2">
        <ProfileForm name={user.name} email={user.email ?? ""} />
        <PasswordForm syncedFromEnv={syncedFromEnv} />
      </div>
    </>
  );
}
