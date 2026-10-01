import type { Metadata } from "next";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { DeleteButton, Notice } from "@/components/admin/form-parts";
import { TermForm } from "@/components/admin/term-form";
import { toFaDigits } from "@/lib/utils";
import { listAdminLenses } from "@/server/admin/taxonomy";

import { deleteLensAction, saveLensAction } from "./actions";

export const metadata: Metadata = { title: "دریچه‌ها" };

export default async function AdminLensesPage({ searchParams }: PageProps<"/admin/lenses">) {
  const params = await searchParams;
  const lenses = await listAdminLenses();

  return (
    <>
      <AdminPageHeader
        title="دریچه‌ها"
        description="رشته‌ای که اپیزود از آن به مسئله نگاه می‌کند. فقط برای فیلتر آرشیو استفاده می‌شود و صفحه‌ی عمومی ندارد."
      />

      {params.saved ? <Notice>دریچه ذخیره شد.</Notice> : null}
      {params.deleted ? <Notice>دریچه حذف شد.</Notice> : null}

      <details className="mb-8 rounded-2xl border border-line bg-surface" open={lenses.length === 0}>
        <summary className="cursor-pointer px-5 py-4 font-bold">افزودن دریچه‌ی جدید</summary>
        <div className="border-t border-line p-5">
          <TermForm
            action={saveLensAction}
            nameLabel="نام دریچه"
            createLabel="افزودن دریچه"
            initial={{ name: "", slug: "", sortOrder: lenses.length + 1 }}
          />
        </div>
      </details>

      <ul className="flex flex-col gap-3">
        {lenses.map((lens) => (
          <li key={lens.id}>
            <details className="group rounded-2xl border border-line bg-surface">
              <summary className="flex cursor-pointer list-none items-center gap-4 px-5 py-4 [&::-webkit-details-marker]:hidden">
                <span className="nums grid size-8 shrink-0 place-items-center rounded-lg bg-surface-2 text-xs font-bold text-ink-muted">
                  {toFaDigits(lens.sortOrder)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-bold">{lens.name}</span>
                  <span className="block truncate text-xs text-ink-subtle" dir="ltr">
                    /episodes?lens={lens.slug}
                  </span>
                </span>
                <span className="text-xs text-ink-muted">{toFaDigits(lens._count.episodes)} اپیزود</span>
                <span className="text-sm font-semibold text-brand-strong group-open:hidden">ویرایش</span>
              </summary>
              <div className="border-t border-line p-5">
                <TermForm
                  action={saveLensAction}
                  nameLabel="نام دریچه"
                  createLabel="افزودن دریچه"
                  initial={{ id: lens.id, name: lens.name, slug: lens.slug, sortOrder: lens.sortOrder }}
                />
                <div className="mt-4 flex justify-start border-t border-line pt-4">
                  <DeleteButton
                    action={deleteLensAction}
                    id={lens.id}
                    label="حذف دریچه"
                    confirmMessage={`دریچه‌ی «${lens.name}» حذف شود؟ اپیزودها باقی می‌مانند و فقط از این دریچه جدا می‌شوند.`}
                  />
                </div>
              </div>
            </details>
          </li>
        ))}
      </ul>
    </>
  );
}
