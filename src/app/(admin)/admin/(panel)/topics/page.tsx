import type { Metadata } from "next";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { DeleteButton } from "@/components/admin/form-parts";
import { TopicForm } from "@/components/admin/topic-form";
import { toFaDigits } from "@/lib/utils";
import { db } from "@/server/db";

import { deleteTopicAction } from "./actions";

export const metadata: Metadata = { title: "موضوع‌ها" };

export default async function AdminTopicsPage({ searchParams }: PageProps<"/admin/topics">) {
  const params = await searchParams;
  const topics = await db.topic.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { episodes: true } } },
  });

  const notice = params.saved ? "موضوع ذخیره شد." : params.deleted ? "موضوع حذف شد." : null;

  return (
    <>
      <AdminPageHeader
        title="موضوع‌ها"
        description="موضوع‌ها صفحه‌های محوری سایت‌اند و بعداً مقاله‌ها و ویدیوها هم به همین‌ها وصل می‌شوند."
      />

      {notice ? (
        <p role="status" className="mb-6 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm font-medium text-success">
          {notice}
        </p>
      ) : null}

      <details className="mb-8 rounded-2xl border border-line bg-surface" open={topics.length === 0}>
        <summary className="cursor-pointer px-5 py-4 font-bold">افزودن موضوع جدید</summary>
        <div className="border-t border-line p-5">
          <TopicForm
            initial={{ name: "", slug: "", description: "", body: "", sortOrder: topics.length + 1, seoTitle: "", seoDescription: "" }}
          />
        </div>
      </details>

      <ul className="flex flex-col gap-3">
        {topics.map((topic) => (
          <li key={topic.id}>
            <details className="group rounded-2xl border border-line bg-surface">
              <summary className="flex cursor-pointer list-none items-center gap-4 px-5 py-4 [&::-webkit-details-marker]:hidden">
                <span className="nums grid size-8 shrink-0 place-items-center rounded-lg bg-surface-2 text-xs font-bold text-ink-muted">
                  {toFaDigits(topic.sortOrder)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-bold">{topic.name}</span>
                  <span className="block truncate text-xs text-ink-subtle" dir="ltr">
                    /topics/{topic.slug}
                  </span>
                </span>
                <span className="text-xs text-ink-muted">{toFaDigits(topic._count.episodes)} اپیزود</span>
                <span className="text-sm font-semibold text-brand-strong group-open:hidden">ویرایش</span>
              </summary>
              <div className="border-t border-line p-5">
                <TopicForm
                  initial={{
                    id: topic.id,
                    name: topic.name,
                    slug: topic.slug,
                    description: topic.description ?? "",
                    body: topic.body ?? "",
                    sortOrder: topic.sortOrder,
                    seoTitle: topic.seoTitle ?? "",
                    seoDescription: topic.seoDescription ?? "",
                  }}
                />
                <div className="mt-4 flex justify-start border-t border-line pt-4">
                  <DeleteButton
                    action={deleteTopicAction}
                    id={topic.id}
                    label="حذف موضوع"
                    confirmMessage={`موضوع «${topic.name}» حذف شود؟ اپیزودها باقی می‌مانند و فقط از این موضوع جدا می‌شوند.`}
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
