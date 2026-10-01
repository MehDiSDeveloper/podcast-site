# ── one image, one process, one SQLite file on one mounted volume ───────────
# Node matches .nvmrc. Debian (glibc) rather than Alpine so better-sqlite3 can
# use its prebuilt binary; the toolchain is only a fallback and stays in the
# deps stage.
FROM node:24-bookworm-slim AS deps

WORKDIR /app

RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 make g++ \
 && rm -rf /var/lib/apt/lists/*

# postinstall runs `prisma generate`, which needs the schema, its config and a
# DATABASE_URL (any value — generate never connects).
ENV DATABASE_URL="file:/tmp/generate.db"
COPY package.json package-lock.json prisma.config.ts ./
COPY prisma/schema.prisma prisma/schema.prisma
COPY src/lib/load-env.ts src/lib/load-env.ts
RUN npm ci

# ─────────────────────────────────── build ─────────────────────────────────
# `next build` peaks at roughly 1.4 GB and needs the dev dependencies, so it
# belongs here, on a build machine, and not in the container's start-up path:
# the runtime only has to hold `next start` (~380 MB) and starts in seconds,
# which is what makes health checks and zero-downtime restarts work.
FROM node:24-bookworm-slim AS builder

WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Inlined into the client bundle by `next build`, so it has to be known here and
# not only at run time; it must match the NEXT_PUBLIC_SITE_URL the container is
# given, or canonical URLs and the client bundle will disagree.
ARG NEXT_PUBLIC_SITE_URL="http://localhost:3000"
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL

# The build reads the database — generateStaticParams enumerates episode,
# category and tag slugs — so it needs one that at least has the tables, or it
# fails with Prisma P2021. A throwaway file is enough, and because it is empty
# nothing public is prerendered from it: see the note in src/app/(site)/page.tsx.
ENV DATABASE_URL="file:/tmp/build.db"
RUN npx prisma generate \
 && npx prisma migrate deploy \
 && npx next build

# ──────────────────────────────────── run ──────────────────────────────────
FROM node:24-bookworm-slim

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

WORKDIR /app

# Only for the container health check (`curl --fail`), which the host runs from
# inside the container; node:slim ships without it.
RUN apt-get update \
 && apt-get install -y --no-install-recommends curl \
 && rm -rf /var/lib/apt/lists/*

COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Both are generated, so both are absent from the build context (.dockerignore).
COPY --from=builder /app/src/generated ./src/generated
COPY --from=builder /app/.next ./.next

# data/ is the volume mount point: the SQLite database and uploads live here.
RUN mkdir -p data/uploads && chmod +x docker/start.sh

EXPOSE 3000
CMD ["./docker/start.sh"]
