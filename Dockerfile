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

FROM node:22.17.0-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
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
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
