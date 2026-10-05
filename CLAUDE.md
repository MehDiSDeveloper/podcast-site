@AGENTS.md

# Podcast site

Persian (RTL) podcast + personal-brand site aimed at hiring managers. Next.js 16, React 19, Prisma 7 (SQLite), Tailwind 4, Zod 4.

## Principles (apply to every change)

- **Simple code:** the simplest solution that works; no needless abstraction or complexity.
- **Scalable:** structure code and data so they grow without rewrites.
- **Consistent, high-quality UX:** every screen behaves and looks like the rest of the product.
- **Clean, beautiful UI:** minimal, friendly, self-explanatory, following proven global patterns.
- **Short user paths:** fewest steps and clicks to finish a task; cut any step that isn't needed.
- **Stay on task:** do only what the task needs; no unrelated extras unless truly required.

## Running — Docker only

Never run `npm run dev` / `next start` on the host.

- Start / apply code changes: `docker compose up -d --build` → http://localhost:8006
- Logs: `docker compose logs -f web`
- One-off commands: `docker compose run --rm web <cmd>`, e.g. `npm run lint`, `sh -c "npx next typegen && npx tsc --noEmit"`, `npx prisma db seed`
- New migration (bind-mount `prisma/` so the migration file lands in the repo):
  `docker compose run --rm -v ./prisma:/app/prisma web npx prisma migrate dev --name <name>`
  Prisma 7's `migrate dev` does **not** regenerate the client — rebuild the image afterwards.

`next build` runs in the image, against a throwaway migrated database, so nothing public is prerendered from real content — see *Rendering* below. `docker/start.sh` then only runs `migrate deploy` and `next start`, and the container is answering in under a second. All persistent state is `./data` (SQLite + uploads); compose overrides `DATABASE_URL`, `UPLOAD_DIR`, `NEXT_PUBLIC_SITE_URL` from `.env`.

`NEXT_PUBLIC_SITE_URL` is inlined into the client bundle by `next build`, so it is a **build argument** as well as a runtime variable (`docker-compose.yml` → `build.args`, `liara.json` → `build.args`). Change it in both places or the client bundle and the canonical URLs will disagree.

The admin user is created/repaired from `ADMIN_*` in `.env` on every start (`src/server/bootstrap.ts`). With `ADMIN_SYNC_PASSWORD` not `"false"`, passwords changed in the panel revert on restart.

## Rendering

The image is built without the production database — it is on a mounted disk and only exists at run time — so any page prerendered at build time would be a snapshot of an empty database.

- Public pages that read the DB on a **static** route are `export const dynamic = "force-dynamic"`: `/`, `/categories`, `/feed.xml`, `/sitemap.xml`. Add that line to any new one.
- Detail routes (`/episodes/[slug]`, `/categories/[slug]`, `/tags/[slug]` and the episode OG image) keep `generateStaticParams`. It returns nothing at build time, so each page is generated on first request and then cached, and `revalidatePublicContent()` refreshes it.
- Config-only pages (`/about`, icons, `robots.txt`, the site OG image) stay fully static.

## Architecture rules

- Only `src/server/*` (all `server-only`) touches Prisma. Pages and server actions call it.
- Zod schemas in `src/lib/validation` are shared by client and server. Status-like columns are strings (SQLite has no enums); allowed values live in `src/lib/enums.ts`.
- Brand, links and the service offering come from `src/config/` — never hardcode them.
- Admin mutations call `revalidatePublicContent()` (`src/server/revalidate.ts`).
- `src/proxy.ts` (Next 16's renamed middleware) only checks a cookie exists; real auth is `requireUser()` in the `(panel)` layout and in every server action/route handler. Route handlers must also check `Origin` (no built-in CSRF like server actions).

## Gotchas

- A `loading.tsx` above a page that calls `notFound()` makes it return 200 instead of 404 — that's why the archive lives in `episodes/(archive)/`.
- Admin forms submit via `useFormAction` (`components/admin/form-parts.tsx`), not `<form action>`, or React 19 wipes fields after a validation error.
- Uploads are served by `src/app/uploads/[...path]/route.ts` (Range support); Next doesn't serve files added to `public/` after build.
- Persian text in `next/og` images must go through `RtlText` in `src/lib/og.tsx` (Satori has no bidi).
- User-facing numbers go through `toFaDigits`; `.nums` must not force LTR (breaks «اپیزود ۱»).
- Admin pages have a logout `<form>` in the sidebar before `<main>` — scope DOM queries to `main form` in tests.

## Production: where and how this site is live

> A deploy changes the **live** site. Ask the user before deploying.

| | |
|---|---|
| URL | https://darshan.ir (`www.` and `http://` redirect here) |
| Server | VPS `91.207.18.218` (Webdade, Ubuntu 24.04). From Windows: `ssh vps` → user `deploy` (key login, passwordless sudo, in the `docker` group) |
| App dir | `/srv/podcast-site/`: code (replaced on every deploy), `.env` (production secrets, only on the server), `data/` (the volume; deploy never touches it) |
| Container | published on `127.0.0.1:8006` → 3000. Only Caddy is public (ports 80/443) |
| Reverse proxy | Caddy on the host, automatic Let's Encrypt HTTPS. Config source `G:\Repos\devops\server\caddy\Caddyfile`, applied with `bash /g/Repos/devops/caddy-apply.sh` |
| Runbook | `G:\Repos\devops\RUNBOOK.md` (server layout, logs, restart, backups, DNS). Keep it updated after any server change |
| Source code | GitHub `MehDiSDeveloper/podcast-site` (public). Only a backup/history: deploy uploads the local working copy, not git |

**Deploy** (Windows PowerShell; takes the **local working copy**, uncommitted changes included, git is not involved):

```
G:\Repos\devops\deploy.ps1 podcast-site
```

It uploads the repo without `.git`, `.venv`, `node_modules`, `.next`, `.env*`, `data/` and the dev-only compose file,
strips CRLF from `*.sh`, rsyncs into `/srv/podcast-site/` (keeping `.env` and `data/`), runs `docker compose up -d --build`
and waits for a 200 on `http://127.0.0.1:8006/robots.txt`. Migrations run in the container's start script, so there is no manual step.

**Compose on the server.** The server `.env` sets `COMPOSE_FILE=docker-compose.yml:docker-compose.prod.yml`. `docker-compose.prod.yml` is not in this repo; it lives in `G:\Repos\devops\server\podcast-site\` and is shipped by `deploy.sh`. It replaces the port with `127.0.0.1:8006` and sets the production site URL (see below).
If you change the service name, the container port or the published port here, update `G:\Repos\devops\`
(`deploy.sh`, `server/podcast-site/`, the Caddyfile) in the same change, or the live site breaks.

**Production environment** lives only in `/srv/podcast-site/.env` (mode 600). A new variable the code needs must be added there too,
not only to `.env.example`. Change a key without opening the file (it backs up `.env` and re-creates the container):
`printf 'KEY=value\n' | bash /g/Repos/devops/env-set.sh podcast-site`. Never print, copy into chat or commit its values.

**Look at the live app:**

```
ssh vps "cd /srv/podcast-site && docker compose ps && docker compose logs --tail 100"
```

**Backups:** `data/` is backed up every night (03:30) to `/var/backups/apps/` on the server and pulled daily to `G:\apps backup` on Windows; 14 days are kept in each place. How to restore: RUNBOOK → Backups.

**Specific to this app:**

- `NEXT_PUBLIC_SITE_URL=https://darshan.ir` is set in `docker-compose.prod.yml` as **both** a build arg and a runtime env.
  `docker-compose.yml` keeps `http://localhost:8006` for local work, so don't change it there for production.
- `next build` runs on the server (4 GB RAM + 4 GB swap), about 2 minutes per deploy.
- The admin is re-applied from `ADMIN_*` in the server `.env` on every start (`ADMIN_SYNC_PASSWORD=true`):
  change the admin password in that `.env`, not in the panel.
- `@workinvtbot` (`NOTIFY_BOT_*`) only sends notifications and receives nothing, so the same token may also be used locally.
- The live database started empty on 2026-09-30 and was **not** seeded. **Never run `prisma db seed` on the server**:
  it adds demo episodes.
- Liara is no longer used. `liara.json` and `docs/deploy-liara.md` are legacy.
- One-off commands: `ssh vps "cd /srv/podcast-site && docker compose exec -T web <cmd>"`.

## Deploying

Production is the VPS described above. Liara is no longer used; `liara.json` and `docs/deploy-liara.md` are kept only as history.

## Conventions

- UI copy in Persian; code, comments and commits in English.
- Commit messages: short, lowercase, human style, no AI co-author trailer.
- Before committing: lint and typecheck (via Docker) must pass with zero warnings.
