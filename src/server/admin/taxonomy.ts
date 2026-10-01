import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { normalizeFa, slugify } from "@/lib/utils";
import type { CategoryInput, LensInput, TagInput } from "@/lib/validation/admin";

import { db } from "../db";

/** Admin-side CRUD for categories, lenses and tags. */

export type SaveTermResult =
  | { ok: true }
  | { ok: false; field: "slug" | "name"; message: string };

const byOrder = [{ sortOrder: "asc" as const }, { name: "asc" as const }];

/** Resolves the final slug, or explains why it cannot be used. */
async function checkSlug(
  model: "category" | "lens" | "tag",
  rawSlug: string | undefined,
  name: string,
  id?: string,
): Promise<{ slug: string } | { error: SaveTermResult & { ok: false } }> {
  const slug = slugify(rawSlug || name);
  if (!slug) return { error: { ok: false, field: "slug", message: "نامک معتبر نیست." } };

  const where = { slug, ...(id ? { id: { not: id } } : {}) };
  const clash =
    model === "category"
      ? await db.category.findFirst({ where, select: { id: true } })
      : model === "lens"
        ? await db.lens.findFirst({ where, select: { id: true } })
        : await db.tag.findFirst({ where, select: { id: true } });

  return clash ? { error: { ok: false, field: "slug", message: "نامک تکراری است." } } : { slug };
}

// ------------------------------------------------------------ categories

export async function listAdminCategories() {
  return db.category.findMany({ orderBy: byOrder, include: { _count: { select: { episodes: true } } } });
}

export async function saveCategory({ slug: rawSlug, ...input }: CategoryInput, id?: string): Promise<SaveTermResult> {
  const checked = await checkSlug("category", rawSlug, input.name, id);
  if ("error" in checked) return checked.error;

  const data = {
    slug: checked.slug,
    name: input.name,
    description: input.description ?? null,
    body: input.body ?? null,
    accentColor: input.accentColor ?? null,
    sortOrder: input.sortOrder,
    seoTitle: input.seoTitle ?? null,
    seoDescription: input.seoDescription ?? null,
  };

  if (id) await db.category.update({ where: { id }, data });
  else await db.category.create({ data });
  return { ok: true };
}

/** Refuses while any episode, draft or not, still belongs to the category. */
export async function deleteCategory(id: string): Promise<"deleted" | "in-use"> {
  const inUse = await db.episode.count({ where: { categoryId: id } });
  if (inUse > 0) return "in-use";
  await db.category.deleteMany({ where: { id } });
  return "deleted";
}

export async function categoryExists(id: string) {
  return (await db.category.count({ where: { id } })) > 0;
}

// ---------------------------------------------------------------- lenses

export async function listAdminLenses() {
  return db.lens.findMany({ orderBy: byOrder, include: { _count: { select: { episodes: true } } } });
}

export async function saveLens({ slug: rawSlug, ...input }: LensInput, id?: string): Promise<SaveTermResult> {
  const checked = await checkSlug("lens", rawSlug, input.name, id);
  if ("error" in checked) return checked.error;

  const data = { slug: checked.slug, name: input.name, sortOrder: input.sortOrder };
  if (id) await db.lens.update({ where: { id }, data });
  else await db.lens.create({ data });
  return { ok: true };
}

export async function deleteLens(id: string) {
  // Episode links cascade; the episodes themselves are untouched.
  await db.lens.deleteMany({ where: { id } });
}

// ------------------------------------------------------------------ tags

export async function listAdminTags() {
  return db.tag.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { episodes: true } } } });
}

export async function saveTag({ slug: rawSlug, ...input }: TagInput, id?: string): Promise<SaveTermResult> {
  const checked = await checkSlug("tag", rawSlug, input.name, id);
  if ("error" in checked) return checked.error;

  const nameClash = await db.tag.findFirst({
    where: { name: input.name, ...(id ? { id: { not: id } } : {}) },
    select: { id: true },
  });
  if (nameClash) return { ok: false, field: "name", message: "برچسبی با این نام وجود دارد." };

  const data = { slug: checked.slug, name: input.name };
  if (id) await db.tag.update({ where: { id }, data });
  else await db.tag.create({ data });
  return { ok: true };
}

export async function deleteTag(id: string) {
  await db.tag.deleteMany({ where: { id } });
}

/**
 * Maps tag names from the episode form to ids, creating the missing ones.
 * An existing tag matches on its normalized name or on the slug the name would
 * get, so a renamed slug or a variant spelling reuses the tag instead of
 * failing on the unique constraint.
 */
export async function resolveTagIds(tx: Prisma.TransactionClient, names: string[]): Promise<string[]> {
  const ids = new Set<string>();

  for (const raw of names) {
    const name = normalizeFa(raw);
    const slug = slugify(name);
    if (!name || !slug) continue;

    const existing = await tx.tag.findFirst({ where: { OR: [{ name }, { slug }] }, select: { id: true } });
    const tag = existing ?? (await tx.tag.create({ data: { name, slug }, select: { id: true } }));
    ids.add(tag.id);
  }

  return [...ids];
}
