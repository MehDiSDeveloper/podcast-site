# زاویه — Podcast & Personal Brand Site

> وب‌سایت پادکست و برند شخصی برای تولید محتوا در حوزه‌ی روان‌شناسی کار، علوم اعصاب، فلسفه و اقتصاد رفتاری — با هدف دیده‌شدن توسط کارفرماها و دعوت به همکاری (کوچینگ، کارگاه، مشاوره، سخنرانی).

A Persian (RTL) podcast site built to turn listeners into collaboration leads. The audience is hiring managers and executives, so every page is designed around one question: *can this person help my team?*

## Highlights

- **Persistent audio player** — one `<audio>` element above the router, so playback continues while visitors browse. Resume position, playback speed, keyboard shortcuts and OS media controls (Media Session API).
- **SEO as architecture, not decoration** — per-page JSON-LD (`PodcastSeries`, `PodcastEpisode`, `CollectionPage`, `FAQPage`, `ProfessionalService`, `Person`, `BreadcrumbList`), canonical URLs, sitemap, robots, real 404 status codes, and generated Open Graph images with correct Persian (RTL + ZWNJ) rendering.
- **Apple-compliant RSS feed** at `/feed.xml` (itunes namespace, enclosure length/type, durations, categories).
- **Topic hubs** — shared taxonomy that works as pillar pages today and will connect articles and videos later.
- **Collaboration funnel** — outcome-first service pages, FAQ, and a contact form with validation, rate limiting, honeypot + timing spam guards, and source attribution.
- **Admin panel** — episodes (audio upload with progress or external URL, automatic duration detection), topics, inquiries, account.
- **Security** — DB-backed sessions with hashed tokens, `__Host-` cookies, login throttling per IP and username, timing-safe login, CSRF checks, HTML sanitisation, path-traversal-safe file serving, security headers.
- **Accessibility** — semantic landmarks, skip link, focus management on form errors, native controls for sliders and disclosure, AA contrast in light and dark themes.

## Stack

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind CSS 4 · Prisma 7 (SQLite, Postgres-ready) · Zod 4

## Getting started

Requires Node.js **20.19+** (see `.nvmrc`).

```bash
npm install
cp .env.example .env        # then set ADMIN_USERNAME, ADMIN_PASSWORD, APP_SECRET
npm run db:migrate          # creates the SQLite database
npm run db:seed             # optional demo topics and episodes
npm run dev
```

Site: http://localhost:3000 · Admin: http://localhost:3000/admin

The admin account from `.env` is created (or repaired) on **every server start** by `src/instrumentation.ts`, so you can never be locked out. With `ADMIN_SYNC_PASSWORD="true"` (default), `ADMIN_PASSWORD` is re-applied on each start; set it to `"false"` to manage the password from the panel.

## Project structure

```
prisma/                  schema, migrations, seed
src/
  app/
    (site)/              public pages — home, episodes, topics, collaborate, about, contact
    (admin)/admin/       login + (panel) with dashboard, episodes, topics, inquiries, account
    api/                 upload + play-count endpoints
    uploads/[...path]/   serves uploaded media with HTTP Range support
    feed.xml/ sitemap.ts robots.ts manifest.ts icon.tsx
  components/            ui primitives, site, player, admin, seo
  config/                site identity (brand, links) and service offering — edit these first
  lib/                   utils, enums, validation schemas, structured data, sanitiser
  server/                data access, auth, uploads, bootstrap (server-only)
```

Layering: pages and actions call `src/server/*`; only that layer touches Prisma. Validation lives in `src/lib/validation` and is shared by client and server.

## Sitemap

| Path | Purpose |
| --- | --- |
| `/` | Positioning, featured episode, problem areas, latest episodes, services |
| `/episodes` · `/episodes/[slug]` | Searchable archive · episode page with player, show notes, related episodes |
| `/topics` · `/topics/[slug]` | Topic hubs (SEO pillars) |
| `/collaborate` | Services for organisations, process, FAQ |
| `/about` | Background and approach |
| `/contact` | Collaboration inquiry form (`?type=WORKSHOP` preselects a service) |
| `/feed.xml` · `/sitemap.xml` | Podcast feed · sitemap |

## Customising

- **Brand, author, social and podcast-directory links:** `src/config/site.ts` (the name is a placeholder).
- **Services, FAQ, process:** `src/config/services.ts`.
- **Credentials on the About page:** `siteConfig.author.credentials` — hidden until filled in, so no placeholder claims are ever shown.
- **Colours and typography:** tokens at the top of `src/app/globals.css`.
- **New-inquiry notifications:** set `INQUIRY_WEBHOOK_URL` (Slack/Discord/n8n-compatible JSON).

## Deployment notes

- Set `NEXT_PUBLIC_SITE_URL` and `APP_SECRET`. Use HTTPS (session cookies are `Secure` in production).
- Uploaded media is stored in `UPLOAD_DIR` (default `storage/uploads`) — mount it on persistent storage.
- `npm run build` runs `prisma migrate deploy` before building.
- **Postgres:** change `provider` in `prisma/schema.prisma` and swap the adapter in `src/server/db.ts` for `@prisma/adapter-pg`.

## Roadmap

The data model and routes are prepared for:

- **Articles** — an `Article` model joined to the existing `Topic` taxonomy; topic hubs become funnels (article → episode → collaborate).
- **Video** — a `Video` model or a video enclosure on episodes.
- **Transcripts** — the field already exists and is rendered and indexed when filled.
- Testimonials and client logos on `/collaborate`, a newsletter, and a strict nonce-based CSP.
