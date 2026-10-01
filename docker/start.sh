#!/bin/sh
set -e

# The Next build is baked into the image, so start-up only has to bring the
# schema on the mounted disk up to date. Keeping this short matters on a PaaS:
# the container has to answer the health check before traffic is switched to it.
npx prisma migrate deploy

# The disk is mounted over /app/data, which hides the directory the image
# created, so a fresh volume starts without it.
mkdir -p "${UPLOAD_DIR:-/app/data/uploads}"

# exec, and the real binary rather than npx, so next start is PID 1 and gets
# SIGTERM directly on restart or redeploy.
exec ./node_modules/.bin/next start
