"use server";

import { redirect } from "next/navigation";

import { slugify } from "@/lib/utils";
import { topicSchema, type TopicInput } from "@/lib/validation/admin";
import { toFieldErrors, type FormState } from "@/lib/validation/episode";
import { requireUser } from "@/server/auth";
import { db } from "@/server/db";
import { revalidatePublicContent } from "@/server/revalidate";

export type TopicFormState = FormState<keyof TopicInput>;

export async function saveTopicAction(_previous: TopicFormState, formData: FormData): Promise<TopicFormState> {
  await requireUser();

  const id = String(formData.get("id") ?? "") || undefined;
  const parsed = topicSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      status: "error",
      message: "چند فیلد نیاز به اصلاح دارد.",
      fieldErrors: toFieldErrors<keyof TopicInput>(parsed.error.issues),
    };
  }

  const { slug: rawSlug, ...input } = parsed.data;
  const slug = slugify(rawSlug || input.name);
  if (!slug) {
    return { status: "error", message: "نامک معتبر نیست.", fieldErrors: { slug: "نامک معتبر نیست." } };
  }

  const clash = await db.topic.findFirst({ where: { slug, ...(id ? { id: { not: id } } : {}) }, select: { id: true } });
  if (clash) {
    return { status: "error", message: "این نامک قبلاً استفاده شده است.", fieldErrors: { slug: "نامک تکراری است." } };
  }

  const data = {
    slug,
    name: input.name,
    description: input.description ?? null,
    body: input.body ?? null,
    sortOrder: input.sortOrder,
    seoTitle: input.seoTitle ?? null,
    seoDescription: input.seoDescription ?? null,
  };

  if (id) await db.topic.update({ where: { id }, data });
  else await db.topic.create({ data });

  revalidatePublicContent();
  redirect("/admin/topics?saved=1");
}

export async function deleteTopicAction(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  // Episode links cascade; the episodes themselves are untouched.
  if (id) await db.topic.deleteMany({ where: { id } });
  revalidatePublicContent();
  redirect("/admin/topics?deleted=1");
}
