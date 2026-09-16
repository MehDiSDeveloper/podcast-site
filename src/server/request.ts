import "server-only";

import { createHash } from "node:crypto";
import { headers } from "next/headers";

/**
 * Best-effort client IP. Behind a proxy the left-most x-forwarded-for entry is
 * the original client; this is only used for rate limiting, so a spoofed value
 * costs an attacker nothing they couldn't get by rotating IPs anyway.
 */
export async function getClientIp(): Promise<string> {
  const store = await headers();
  const forwarded = store.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return store.get("x-real-ip")?.trim() || "unknown";
}

export async function getUserAgent(): Promise<string | null> {
  const store = await headers();
  return store.get("user-agent")?.slice(0, 300) ?? null;
}

/**
 * Salted hash of an IP address. IPv4 has only ~4 billion values, so an
 * unsalted hash is trivially reversible — the secret is what makes storing it
 * privacy-preserving.
 */
export function hashIp(ip: string): string {
  const secret = process.env.APP_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("APP_SECRET must be set in production.");
  }
  return createHash("sha256")
    .update(`${secret ?? "dev-only-secret"}:${ip}`)
    .digest("hex");
}
