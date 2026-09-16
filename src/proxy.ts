import { NextResponse, type NextRequest } from "next/server";

/**
 * Edge gate for the admin panel (Next 16 renamed `middleware` to `proxy`).
 *
 * This is deliberately a cheap, optimistic check — it only asks "is there a
 * session cookie at all?" so anonymous visitors bounce to the login page
 * without touching the database. The authoritative check (token exists, not
 * expired, user still active) happens in the admin layout via requireUser().
 * Never rely on this file alone for authorisation.
 */

const COOKIE_NAMES = ["__Host-session", "session"];

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname === "/admin/login") return NextResponse.next();

  const hasSession = COOKIE_NAMES.some((name) => request.cookies.has(name));
  if (hasSession) return NextResponse.next();

  const loginUrl = new URL("/admin/login", request.url);
  // Send the admin back where they were headed once they have signed in.
  if (pathname !== "/admin") loginUrl.searchParams.set("next", `${pathname}${search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*"],
};
