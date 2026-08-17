# syntax=docker/dockerfile:1.7
FROM node:22.17.0-bookworm-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM deps AS builder
COPY . .
ARG NEXT_PUBLIC_SITE_URL=http://localhost:3000
ARG IMGPROXY_PUBLIC_URL=http://localhost:8080
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV IMGPROXY_PUBLIC_URL=$IMGPROXY_PUBLIC_URL
ENV DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build
ENV PAYLOAD_SECRET=build-only-placeholder-secret-never-used-at-runtime
ENV STORAGE_ROOT=/tmp/agomoni-build/photos
ENV APP_INTERNAL_URL=http://app:3000
ENV IMGPROXY_KEY=0000000000000000000000000000000000000000000000000000000000000000
ENV IMGPROXY_SALT=1111111111111111111111111111111111111111111111111111111111111111
ENV NEXT_PHASE=phase-production-build
ENV NEXT_TELEMETRY_DISABLED=1
# The default Payload admin UI has been removed (the custom Studio at /studio is
# the only admin surface), so there are no path-referenced admin components to
# register — a plain Next.js build is all that's needed.
RUN pnpm build

FROM builder AS migration
CMD ["pnpm", "migrate"]

# Slim runtime image — no pnpm/corepack. Migrations call the Payload CLI via node.
FROM node:22.17.0-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
# Railway injects PORT; Render injects PORT too. Default to 3000 for Docker Compose and local use.
ENV PORT=3000
RUN groupadd --system --gid 1001 nodejs && useradd --system --uid 1001 --gid nodejs nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
RUN node - <<'NODE'
const fs = require('node:fs')
const path = require('node:path')
const sharp = require('./node_modules/sharp/package.json')
const packageRoot = './node_modules/.pnpm'
const linkRoot = './node_modules/@img'
const names = [`@img/sharp-${process.platform}-${process.arch}`, `@img/sharp-libvips-${process.platform}-${process.arch}`]
fs.mkdirSync(linkRoot, { recursive: true })
for (const name of names) {
  const version = sharp.optionalDependencies?.[name]
  if (!version) throw new Error(`Sharp does not declare ${name}`)
  const prefix = `${name.replace('/', '+')}@${version}`
  const entry = fs.readdirSync(packageRoot).find((candidate) => candidate === prefix || candidate.startsWith(`${prefix}_`))
  if (!entry) throw new Error(`Missing pnpm package for ${name}@${version}`)
  const packageName = name.split('/')[1]
  const target = path.relative(linkRoot, path.join(packageRoot, entry, 'node_modules', '@img', packageName))
  fs.symlinkSync(target, path.join(linkRoot, packageName), 'dir')
}
NODE
# Full node_modules so the Payload CLI can resolve deps at runtime.
# This adds ~200 MB but avoids a separate migration container on Render/Railway.
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=deps --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=deps --chown=nextjs:nodejs /app/pnpm-lock.yaml ./pnpm-lock.yaml
# Payload CLI loads payload.config.ts + path aliases — keep the source it imports.
COPY --from=builder --chown=nextjs:nodejs /app/payload.config.ts ./payload.config.ts
COPY --from=builder --chown=nextjs:nodejs /app/tsconfig.json ./tsconfig.json
COPY --from=builder --chown=nextjs:nodejs /app/collections ./collections
COPY --from=builder --chown=nextjs:nodejs /app/globals ./globals
COPY --from=builder --chown=nextjs:nodejs /app/lib ./lib
COPY --from=builder --chown=nextjs:nodejs /app/migrations ./migrations
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE ${PORT}
# Avoid `pnpm migrate` here: corepack tries to write under /home/nextjs and fails (EACCES).
# Call the Payload binary with node instead, then start the standalone server.
# On Docker Compose: the dedicated `migrate` service handles migrations (this CMD is not used).
CMD ["sh", "-c", "node ./node_modules/payload/bin.js migrate && node server.js"]
