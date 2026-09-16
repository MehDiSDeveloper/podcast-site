import { AdminShell } from "@/components/admin/admin-shell";
import { requireUser } from "@/server/auth";
import { countNewInquiries } from "@/server/inquiries";

import { logout } from "./actions";

/**
 * Authoritative auth boundary for every page in the panel. proxy.ts only checks
 * that a cookie exists; this verifies the session against the database.
 */
export default async function PanelLayout({ children }: LayoutProps<"/admin">) {
  const user = await requireUser();
  const newInquiries = await countNewInquiries();

  return (
    <AdminShell user={user} newInquiries={newInquiries} logoutAction={logout}>
      {children}
    </AdminShell>
  );
}
