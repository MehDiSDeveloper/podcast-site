import type { Metadata } from "next";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { CategoryForm } from "@/components/admin/category-form";
import { DeleteButton, Notice } from "@/components/admin/form-parts";
import { toFaDigits } from "@/lib/utils";
import { listAdminCategories } from "@/server/admin/taxonomy";

import { deleteCategoryAction } from "./actions";

export const metadata: Metadata = { title: "دسته‌ها" };

export default async function AdminCategoriesPage({ searchParams }: PageProps<"/admin/categories">) {
  const params = await searchParams;
  const categories = await listAdminCategories();

  return (
    <>
      <AdminPageHeader
        title="دسته‌ها"
        description="هر اپیزود دقیقاً یک دسته دارد و بدون آن منتشر نمی‌شود. صفحه‌ی هر دسته، صفحه‌ی محوری سئو برای آن است."
      />

      {params.saved ? <Notice>دسته ذخیره شد.</Notice> : null}
      {params.deleted ? <Notice>دسته حذف شد.</Notice> : null}
      {params["in-use"] ? (
        <Notice tone="danger">این دسته هنوز اپیزود دارد. اول دسته‌ی آن اپیزودها را عوض کنید.</Notice>
      ) : null}

      <details className="mb-8 rounded-2xl border border-line bg-surface" open={categories.length === 0}>
        <summary className="cursor-pointer px-5 py-4 font-bold">افزودن دسته‌ی جدید</summary>
        <div className="border-t border-line p-5">
          <CategoryForm
            initial={{
              name: "",
              slug: "",
              description: "",
              body: "",
              accentColor: "",
              sortOrder: categories.length + 1,
              seoTitle: "",
              seoDescription: "",
            }}
          />
        </div>
      </details>

      <ul className="flex flex-col gap-3">
        {categories.map((category) => (
          <li key={category.id}>
            <details className="group rounded-2xl border border-line bg-surface">
              <summary className="flex cursor-pointer list-none items-center gap-4 px-5 py-4 [&::-webkit-details-marker]:hidden">
                <span
                  className="nums grid size-8 shrink-0 place-items-center rounded-lg bg-surface-2 text-xs font-bold text-ink-muted"
                  style={category.accentColor ? { boxShadow: `inset 0 -3px 0 ${category.accentColor}` } : undefined}
                >
                  {toFaDigits(category.sortOrder)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-bold">{category.name}</span>
                  <span className="block truncate text-xs text-ink-subtle" dir="ltr">
                    /categories/{category.slug}
                  </span>
                </span>
                <span className="text-xs text-ink-muted">{toFaDigits(category._count.episodes)} اپیزود</span>
                <span className="text-sm font-semibold text-brand-strong group-open:hidden">ویرایش</span>
              </summary>
              <div className="border-t border-line p-5">
                <CategoryForm
                  initial={{
                    id: category.id,
                    name: category.name,
                    slug: category.slug,
                    description: category.description ?? "",
                    body: category.body ?? "",
                    accentColor: category.accentColor ?? "",
                    sortOrder: category.sortOrder,
                    seoTitle: category.seoTitle ?? "",
                    seoDescription: category.seoDescription ?? "",
                  }}
                />
                <div className="mt-4 flex justify-start border-t border-line pt-4">
                  {category._count.episodes > 0 ? (
                    <p className="text-xs text-ink-subtle">
                      حذف ممکن نیست: {toFaDigits(category._count.episodes)} اپیزود در این دسته است.
                    </p>
                  ) : (
                    <DeleteButton
                      action={deleteCategoryAction}
                      id={category.id}
                      label="حذف دسته"
                      confirmMessage={`دسته‌ی «${category.name}» حذف شود؟`}
                    />
                  )}
                </div>
              </div>
            </details>
          </li>
        ))}
      </ul>
    </>
  );
}
