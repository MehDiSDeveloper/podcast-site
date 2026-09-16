import type { NextConfig } from "next";

/**
 * Baseline security headers for every response.
 *
 * A full nonce-based CSP is deferred on purpose: the theme and JSON-LD scripts
 * are inline, and a strict policy is worth doing properly rather than half-way
 * with 'unsafe-inline'. These headers are the high-value, zero-breakage set.
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    // The site plays audio and uses the Web Share API; it needs nothing else.
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,

  // Lets the dev server be reached as 127.0.0.1 as well as localhost; Next 16
  // otherwise blocks its dev assets for that origin and the page never hydrates.
  allowedDevOrigins: ["127.0.0.1"],

  images: {
    // Episode covers may be hosted on any podcast host or CDN.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },

  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        // The admin panel must never be framed or cached by a shared proxy.
        source: "/admin/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Cache-Control", value: "no-store" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
      {
        source: "/uploads/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
