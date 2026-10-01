# Deploying to Liara

Liara PaaS, **Docker** platform. One app, one container, one disk. Everything the
platform needs is checked in: `Dockerfile`, `docker/start.sh`, `liara.json`,
`.liaraignore`.

## How this app is built and run

`next build` runs **inside the image**, on Liara's build machine, against a
throwaway migrated SQLite file. The container then only runs
`prisma migrate deploy` and `next start`, and answers within a second.

That matters here:

| | measured locally |
| --- | --- |
| `next build` peak memory | ~1.4 GB (OOM-killed at 1 GB) |
| `next start` resident memory | ~170 MB idle |
| container ready after start | < 1 s |
| final image | ~1.67 GB |
| home page / episode page | ~70 ms / ~50 ms |
| episode OG image | ~430 ms first request, ~160 ms after |

Building at container start — which is what this repo did before — would have
needed a 2 GB plan just to boot, would have written ~110 MB into the container's
temporary filesystem on every start, and would have made every restart a
multi-minute outage. Building in the image removes all three problems.

The trade-off is that the production database does not exist at build time, so
nothing public can be prerendered from real content. See the *Rendering* section
of `CLAUDE.md`: DB-backed static routes are `force-dynamic`, detail pages are
generated on first request and then cached.

## Before you start

### 1. The app

**Decision: a new app, `zavieh`** (default domain `https://zavieh.liara.run`,
which is what `liara.json` bakes in). If that name is taken, pick another and
change the build argument in `liara.json` to match. Once the new app is
verified, delete `challenges`.

```bash
liara create --app zavieh --platform docker --plan small-g2
```

`liara app:list` currently shows one app:

| Name | Platform | Plan | What is on it now |
| --- | --- | --- | --- |
| `challenges` | docker | `small-g2` | a **different project** — a Python/FastAPI app talking to a `actpact-db` Postgres database |

Before deleting it, back up that project: export its environment variables
and make sure its source is committed somewhere. Its Postgres database is a
separate DBaaS service — deleting the app does not delete it.

### 2. The plan

**Decision: `small-g2`** (0.5 GB RAM / 0.5 CPU / 5 GB disk), the same as the
current app. Verified locally under a 512 MB limit: a fresh container starts,
migrates and serves every public route at ~110 MB.

What to keep an eye on with this plan:

- Memory headroom is thin when OG images are rendered, audio is uploaded and
  traffic arrives at once. If `liara logs` ever shows the process being killed,
  `medium-g2` is the fix.
- The disk is carved from the plan's 5 GB of reservable space, so audio files are
  what will run out first. When they do, move audio to a Liara bucket rather than
  upgrading.

### 3. Generate the secrets

```bash
openssl rand -hex 32
```

That value is `APP_SECRET` (it salts the hashed visitor IPs used for rate
limiting; the app throws in production without it). Choose an `ADMIN_PASSWORD`
separately — do not reuse the one from the other project.

## Deploy

### 1. Create the disk

The disk name must be `data`, because `liara.json` mounts it at `/app/data`,
which is where both the SQLite file and the uploads live.

```bash
liara disk create --app zavieh --name data --size 2
```

### 2. Set the environment variables

Do this **before** the first deploy, so the first start already has them —
`liara env set --app zavieh KEY=value …`, or console → app → Settings → Variables
(the COPY/PASTE tab takes a whole `.env`-style block).

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | `file:/app/data/podcast.db` |
| `UPLOAD_DIR` | `/app/data/uploads` |
| `NEXT_PUBLIC_SITE_URL` | `https://zavieh.liara.run` — no trailing slash |
| `APP_SECRET` | the `openssl rand -hex 32` value |
| `ADMIN_USERNAME` | your admin login |
| `ADMIN_PASSWORD` | your admin password |
| `ADMIN_NAME` | display name |
| `ADMIN_EMAIL` | `mahdii.montazeri@gmail.com` |
| `ADMIN_SYNC_PASSWORD` | `true` at first, then see below |
| `NOTIFY_BOT_API` | `https://tapi.bale.ai` (optional) |
| `NOTIFY_BOT_TOKEN` / `NOTIFY_BOT_CHAT_ID` | optional, for inquiry notifications |
| `SMTP_*`, `MAIL_FROM`, `INQUIRY_NOTIFY_EMAIL` | optional, for inquiry emails |

Do **not** set `PORT`. The image fixes it at 3000 and `liara.json` routes to
3000; a different `PORT` would make the health check fail.

`NODE_ENV` is already `production` in the image.

Two notes:

- `ADMIN_SYNC_PASSWORD=true` means `ADMIN_PASSWORD` is re-applied on **every**
  container start, so a password changed in the panel reverts on the next
  restart. Once you are in, either set it to `false` and manage the password in
  the panel, or leave it `true` and treat the environment variable as the source
  of truth.
- `INQUIRY_WEBHOOK_URL` is optional; leave it unset rather than empty-but-wrong.

### 3. The build argument

`NEXT_PUBLIC_SITE_URL` is inlined into the client bundle by `next build`, so it
has to be known at **build** time, not just at run time. `liara.json` already
has it:

```json
"args": ["NEXT_PUBLIC_SITE_URL=https://zavieh.liara.run"]
```

It must match the environment variable exactly, or canonical URLs, OG tags and
the client bundle will disagree.

`build.location` is `germany` on purpose: the image pulls `node:24-bookworm-slim`
and installs from npm and Debian, which is unreliable from the Iran builder.

### 4. Deploy

```bash
liara deploy --app zavieh --platform docker --port 3000
```

`liara.json` already supplies the platform, port, disk, timezone, health check
and build argument, so in practice `liara deploy --app zavieh` is enough. Expect
several minutes on the first deploy — there is no layer cache yet and `npm ci`
plus `next build` both run.

Watch it:

```bash
liara logs --app zavieh --follow
```

A healthy start looks like: `No pending migrations to apply.` → `▲ Next.js` →
`✓ Ready in …ms`, then the `[mail]` and `[messenger]` lines from
`src/instrumentation.ts`.

### 5. Move the existing content over

The deploy ships code, not data. The local database and uploads are in `./data`.

- **Start fresh:** do nothing. `migrate deploy` creates the schema, and
  `src/server/bootstrap.ts` creates the admin user and the default show on the
  first start. Then run the seed if you want the starter taxonomy:
  `liara shell --app zavieh --command "npx prisma db seed"`.
- **Carry the local content over:** console → app → Disks → `data` → FTP access
  → create an access, then connect with FileZilla or WinSCP (FTPS) and upload
  `data/podcast.db` and the contents of `data/uploads/`. Do it while the app is
  stopped, so SQLite is not being written at the same time, and restart
  afterwards.

Audio files are the bulk of the uploads; check the disk has room before copying.

### 6. Domain and TLS

This CLI version has no domain commands — use the console: app → Domains, add
the domain, create the DNS record it shows, then enable SSL once it resolves.
For now the site runs on `zavieh.liara.run`. When a custom domain is added,
change `NEXT_PUBLIC_SITE_URL` in **both** the app's variables and `liara.json`,
and redeploy.

The site depends on HTTPS: in production the session cookie is `__Host-session`
with `Secure`, which browsers refuse over plain HTTP, so **admin login will not
work until TLS is on**.

## After the first deploy — check these

```bash
curl -sI https://zavieh.liara.run/                   # 200
curl -s  https://zavieh.liara.run/feed.xml | head    # real <item> entries, not an empty channel
curl -sI https://zavieh.liara.run/episodes/no-such   # 404, not 200
curl -s  https://zavieh.liara.run/sitemap.xml | head # absolute URLs on your domain, not localhost
```

- `/sitemap.xml` or an OG tag still saying `localhost` means the build argument
  was not applied — fix `liara.json` and redeploy.
- Log in at `/admin`, then publish or edit one episode. That exercises
  `revalidatePublicContent()`, which is what refreshes the on-demand generated
  detail pages.
- Upload an audio file in the panel. This is the one thing worth testing
  deliberately: the upload route rejects the request unless the `Origin` header's
  host matches the `Host` header, so it is the check most likely to be upset by a
  reverse proxy. If it fails with a 403, that is why.
- Play an episode and seek in the middle of it — that exercises the HTTP Range
  support in `src/app/uploads/[...path]/route.ts` through Liara's proxy.
- Submit the contact form once and confirm the inquiry arrives in the panel (and
  on Bale, if configured).

## Redeploying

```bash
liara deploy --app zavieh
```

Zero-downtime deployment is on by default: the old container keeps serving until
the new one passes the health check in `liara.json`. Because the build is baked
into the image, the new container becomes healthy in seconds.

Migrations run at container start, so a deploy that adds a migration applies it
automatically. Generate migrations locally as usual (see `CLAUDE.md`) and commit
the file — never let `migrate dev` run against production.

## Known rough edges

- **SQLite on a network disk.** Liara disks are network-backed, and SQLite's
  locking is happiest on local storage. Liara documents SQLite on a disk as a
  supported pattern and this app has a single writer, so it should be fine — but
  it is the thing to suspect first if you ever see `SQLITE_BUSY` or database
  locked errors. Prisma's Postgres path is a two-line change if it comes to that
  (`prisma/schema.prisma` provider + the adapter in `src/server/db.ts`).
- **Image size.** 1.67 GB, because the runtime stage keeps the full
  `node_modules` so that `prisma migrate deploy` can run at start. Dropping dev
  dependencies saves ~180 MB; `output: "standalone"` in `next.config.ts` would
  cut it to a few hundred MB but needs the Prisma CLI and the better-sqlite3
  native binary traced in by hand. Not worth doing until deploys feel slow.
- **No backups yet.** Everything lives in one SQLite file on one disk. Liara can
  back up disks from the console — turn that on, or pull `podcast.db` over FTP on
  a schedule.
