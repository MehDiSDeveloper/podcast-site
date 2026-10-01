import type { Metadata } from "next";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { DeleteButton, Notice } from "@/components/admin/form-parts";
import { TermForm } from "@/components/admin/term-form";
import { toFaDigits } from "@/lib/utils";
import { listAdminTags } from "@/server/admin/taxonomy";

import { deleteTagAction, saveTagAction } from "./actions";

export const metadata: Metadata = { title: "برچسب‌ها" };

export default async function AdminTagsPage({ searchParams }: PageProps<"/admin/tags">) {
  const params = await searchParams;
  const tags = await listAdminTags();

  return (
    <>
      <AdminPageHeader
        title="برچسب‌ها"
        description="برچسب‌ها از فرم اپیزود هم ساخته می‌شوند. هر برچسبِ دارای اپیزود منتشرشده، صفحه‌ی عمومی دارد."
      />

      {params.saved ? <Notice>برچسب ذخیره شد.</Notice> : null}
      {params.deleted ? <Notice>برچسب حذف شد.</Notice> : null}

      <details className="mb-8 rounded-2xl border border-line bg-surface" open={tags.length === 0}>
        <summary className="cursor-pointer px-5 py-4 font-bold">افزودن برچسب جدید</summary>
        <div className="border-t border-line p-5">
          <TermForm action={saveTagAction} nameLabel="نام برچسب" createLabel="افزودن برچسب" initial={{ name: "", slug: "" }} />
        </div>
      </details>

      {tags.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line-strong bg-surface px-6 py-12 text-center text-sm text-ink-muted">
          هنوز برچسبی ساخته نشده است.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {tags.map((tag) => (
            <li key={tag.id}>
              <details className="group rounded-2xl border border-line bg-surface">
                <summary className="flex cursor-pointer list-none items-center gap-4 px-5 py-4 [&::-webkit-details-marker]:hidden">
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold">{tag.name}</span>
                    <span className="block truncate text-xs text-ink-subtle" dir="ltr">
                      /tags/{tag.slug}
                    </span>
                  </span>
                  <span className="text-xs text-ink-muted">{toFaDigits(tag._count.episodes)} اپیزود</span>
                  <span className="text-sm font-semibold text-brand-strong group-open:hidden">ویرایش</span>
                </summary>
                <div className="border-t border-line p-5">
                  <TermForm
                    action={saveTagAction}
                    nameLabel="نام برچسب"
                    createLabel="افزودن برچسب"
                    initial={{ id: tag.id, name: tag.name, slug: tag.slug }}
                  />
                  <div className="mt-4 flex justify-start border-t border-line pt-4">
                    <DeleteButton
                      action={deleteTagAction}
                      id={tag.id}
                      label="حذف برچسب"
                      confirmMessage={`برچسب «${tag.name}» حذف شود؟ اپیزودها باقی می‌مانند و فقط از این برچسب جدا می‌شوند.`}
                    />
                  </div>
                </div>
              </details>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
