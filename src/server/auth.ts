import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { db } from "./db";
import { fakeVerify, verifyPassword } from "./password";
import { getClientIp, getUserAgent, hashIp } from "./request";

/**
 * Session-based authentication for the admin panel.
 *
 * Design choices:
 * - Opaque random tokens, not JWTs. A session can be revoked instantly (sign
 *   out, disable a user) by deleting a row, with no token blacklist needed.
 * - Only a SHA-256 hash of the token is stored. The token is 256 bits of
 *   randomness, so a plain hash is sufficient (no salt/KDF needed) and a leaked
 *   database cannot be replayed as a login.
 * - CSRF is covered by Next.js Server Actions, which reject cross-origin
 *   requests by comparing Origin and Host, together with SameSite=Lax cookies.
 */

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
/** Extend the session once less than this much lifetime remains. */
const SESSION_REFRESH_MS = 3 * 24 * 60 * 60 * 1000;

/** Brute-force guard: failures allowed per window, per IP and per username. */
const LOGIN_LIMIT = { maxFailures: 5, windowMs: 15 * 60 * 1000 };

const isProduction = process.env.NODE_ENV === "production";

/**
 * `__Host-` pins the cookie to this exact host, over HTTPS, at path "/" — so a
 * sibling subdomain cannot set or overwrite it. Browsers only accept the prefix
 * on secure origins, hence the plain name in local development.
 */
export const SESSION_COOKIE = isProduction ? "__Host-session" : "session";

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

async function setSessionCookie(token: string, expiresAt: Date) {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await db.session.create({
    data: {
      tokenHash: hashToken(token),
      userId,
      expiresAt,
      userAgent: await getUserAgent(),
      ipHash: hashIp(await getClientIp()),
    },
  });

  await setSessionCookie(token, expiresAt);
}

export type SessionUser = {
  id: string;
  username: string;
  name: string;
  email: string | null;
  role: string;
};

/**
 * Resolves the current admin, or null. Wrapped in `cache` so a layout and the
 * page beneath it share one database lookup per request.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await db.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });

  if (!session) return null;

  if (session.expiresAt.getTime() <= Date.now() || !session.user.isActive) {
    await db.session.delete({ where: { id: session.id } }).catch(() => undefined);
    return null;
  }

  // Sliding expiry: an admin who uses the panel regularly stays signed in.
  // Cookies can only be written from a Server Action or Route Handler, so a
  // refresh attempted during a plain render is skipped and retried next time.
  if (session.expiresAt.getTime() - Date.now() < SESSION_REFRESH_MS) {
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    try {
      await setSessionCookie(token, expiresAt);
      await db.session.update({ where: { id: session.id }, data: { expiresAt } });
    } catch {
      // Rendering context — cookie is read-only here.
    }
  }

  const { user } = session;
  return { id: user.id, username: user.username, name: user.name, email: user.email, role: user.role };
});

/** Guard for admin pages and actions: returns the user or redirects to login. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  return user;
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  }
  store.delete(SESSION_COOKIE);
}

/** Signs out every other device, keeping the session making the request. */
export async function revokeOtherSessions(userId: string): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  await db.session.deleteMany({
    where: { userId, ...(token ? { tokenHash: { not: hashToken(token) } } : {}) },
  });
}

// ------------------------------------------------------------------ sign-in

export type SignInResult =
  | { ok: true; userId: string }
  | { ok: false; reason: "invalid" | "throttled" };

export async function signIn(rawUsername: string, password: string): Promise<SignInResult> {
  const username = rawUsername.trim().toLowerCase();
  const ipHash = hashIp(await getClientIp());
  const since = new Date(Date.now() - LOGIN_LIMIT.windowMs);

  // Throttle per IP *and* per username: the first stops one machine guessing
  // many accounts, the second stops a botnet guessing one account.
  const [ipFailures, userFailures] = await Promise.all([
    db.loginAttempt.count({ where: { ipHash, succeeded: false, createdAt: { gte: since } } }),
    db.loginAttempt.count({ where: { username, succeeded: false, createdAt: { gte: since } } }),
  ]);

  if (ipFailures >= LOGIN_LIMIT.maxFailures || userFailures >= LOGIN_LIMIT.maxFailures) {
    return { ok: false, reason: "throttled" };
  }

  const user = await db.user.findFirst({
    where: { username: { equals: username } },
  });

  let valid = false;
  if (user && user.isActive) {
    valid = await verifyPassword(password, user.passwordHash);
  } else {
    // Equalise timing so response speed does not reveal which usernames exist.
    await fakeVerify();
  }

  await db.loginAttempt.create({ data: { username, ipHash, succeeded: valid } });

  if (!valid || !user) return { ok: false, reason: "invalid" };

  await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  return { ok: true, userId: user.id };
}
