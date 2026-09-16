@AGENTS.md

# Podcast site

Persian (RTL) podcast + personal-brand site aimed at hiring managers. Next.js 16, React 19, Prisma 7 (SQLite), Tailwind 4, Zod 4.

## Running — Docker only

Never run `npm run dev` / `next start` on the host.

- Start / apply code changes: `docker compose up -d --build` → http://localhost:8006
- Logs: `docker compose logs -f web`
- One-off commands: `docker compose run --rm web <cmd>`, e.g. `npm run lint`, `sh -c "npx next typegen && npx tsc --noEmit"`, `npx prisma db seed`
- New migration (bind-mount `prisma/` so the migration file lands in the repo):
  `docker compose run --rm -v ./prisma:/app/prisma web npx prisma migrate dev --name <name>`
  Prisma 7's `migrate dev` does **not** regenerate the client — rebuild the image afterwards.

`docker/start.sh` runs `migrate deploy` + `next build` at container start (pages are prerendered from the DB, so building in the image would bake in an empty database). All persistent state is `./data` (SQLite + uploads); compose overrides `DATABASE_URL`, `UPLOAD_DIR`, `NEXT_PUBLIC_SITE_URL` from `.env`.

The admin user is created/repaired from `ADMIN_*` in `.env` on every start (`src/server/bootstrap.ts`). With `ADMIN_SYNC_PASSWORD` not `"false"`, passwords changed in the panel revert on restart.

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

## Conventions

- UI copy in Persian; code, comments and commits in English.
- Commit messages: short, lowercase, human style, no AI co-author trailer.
- Before committing: lint and typecheck (via Docker) must pass with zero warnings.
