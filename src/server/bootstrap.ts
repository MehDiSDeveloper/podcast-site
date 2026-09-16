import { siteConfig } from "@/config/site";

import { db } from "./db";
import { hashPassword, verifyPassword } from "./password";

/**
 * Idempotent startup tasks. Called from instrumentation.ts on every server
 * start and from the seed script, so a fresh clone is usable immediately and
 * an existing install can never end up without a way in.
 */

const DEFAULT_SHOW_SLUG = "main";

async function ensureAdminUser(): Promise<void> {
  // Usernames are matched case-insensitively at sign-in, so store them lower-cased.
  const username = process.env.ADMIN_USERNAME?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!username || !password) {
    console.warn(
      "[bootstrap] ADMIN_USERNAME/ADMIN_PASSWORD are not set — skipping admin bootstrap. Copy .env.example to .env.",
    );
    return;
  }

  const name = process.env.ADMIN_NAME?.trim() || username;
  const email = process.env.ADMIN_EMAIL?.trim() || null;
  const existing = await db.user.findUnique({ where: { username } });

  if (!existing) {
    await db.user.create({
      data: { username, name, email, passwordHash: await hashPassword(password), role: "ADMIN" },
    });
    console.info(`[bootstrap] created admin user "${username}".`);
    return;
  }

  // Keep .env authoritative so a forgotten password is always one restart away
  // from being fixed. Set ADMIN_SYNC_PASSWORD=false to manage it in the panel.
  const shouldSync = (process.env.ADMIN_SYNC_PASSWORD ?? "true") !== "false";
  const updates: Record<string, unknown> = {};

  if (shouldSync && !(await verifyPassword(password, existing.passwordHash))) {
    updates.passwordHash = await hashPassword(password);
  }
  if (!existing.isActive) updates.isActive = true;
  if (existing.role !== "ADMIN") updates.role = "ADMIN";

  if (Object.keys(updates).length > 0) {
    await db.user.update({ where: { id: existing.id }, data: updates });
    console.info(`[bootstrap] re-synced admin user "${username}".`);
  }
}

async function ensureDefaultShow(): Promise<void> {
  const existing = await db.show.findFirst({ where: { isDefault: true } });
  if (existing) return;

  await db.show.upsert({
    where: { slug: DEFAULT_SHOW_SLUG },
    update: { isDefault: true },
    create: {
      slug: DEFAULT_SHOW_SLUG,
      title: siteConfig.name,
      subtitle: siteConfig.tagline,
      description: siteConfig.description,
      author: siteConfig.author.name,
      ownerName: siteConfig.podcast.ownerName,
      ownerEmail: siteConfig.podcast.ownerEmail,
      language: siteConfig.podcast.language,
      category: siteConfig.podcast.itunesCategory,
      subcategory: siteConfig.podcast.itunesSubcategory,
      explicit: siteConfig.podcast.explicit,
      copyright: siteConfig.podcast.copyright,
      coverImage: siteConfig.podcast.artwork,
      isDefault: true,
    },
  });
  console.info("[bootstrap] created default show.");
}

/** Deletes sessions that expired, so the table does not grow without bound. */
async function pruneExpiredSessions(): Promise<void> {
  await db.session.deleteMany({ where: { expiresAt: { lt: new Date() } } });
}

let ran: Promise<void> | null = null;

export function bootstrap(): Promise<void> {
  // Guard against Next.js invoking the instrumentation hook more than once.
  ran ??= (async () => {
    try {
      await ensureDefaultShow();
      await ensureAdminUser();
      await pruneExpiredSessions();
    } catch (error) {
      console.error("[bootstrap] failed:", error);
    }
  })();

  return ran;
}
