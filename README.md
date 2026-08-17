# Agomoni Run 2.0

Community road-running event website for Barasat, West Bengal — World Heart Day edition.

Built with **Next.js 16**, **Payload CMS 3**, **PostgreSQL 17**, and **Docker Compose**. Includes a custom Studio admin, photo gallery with lightbox, partner logos with a marquee ticker, event countdown, race categories, FAQ, and a Google Drive photo import pipeline.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2 (App Router, standalone output) |
| CMS | Payload 3.86 (embedded in Next.js) |
| Database | PostgreSQL 17 |
| Image optimisation | imgproxy 4 (signed URLs via HMAC) |
| Reverse proxy / TLS | Caddy 2.10 (auto HTTPS) |
| Package manager | pnpm 10 |
| Container runtime | Docker Compose |

---

## Local development

### Prerequisites

- Docker Desktop (or Docker Engine + Compose plugin)
- Node.js 20+ and pnpm 10+

### 1. Clone and install

```bash
git clone https://github.com/balasportiz/agomini.git
cd agomini
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`. The defaults work for local Docker development — the only value you must change for a working local setup is `POSTGRES_PASSWORD` (any string is fine locally):

```env
POSTGRES_PASSWORD=any-local-password
PAYLOAD_SECRET=at-least-32-random-characters-here
```

Leave `IMGPROXY_KEY` and `IMGPROXY_SALT` empty locally — image signing is disabled when they are blank, and imgproxy still serves images.

### 3. Start everything

```bash
docker compose up --build
```

This starts Postgres, runs database migrations, starts the app, and starts imgproxy. The first build takes 2–3 minutes. After that:

- Public site: http://localhost:3000
- Studio admin: http://localhost:3000/studio
- imgproxy: http://localhost:8080

### 4. Create the first admin account

Open http://localhost:3000/studio — on a fresh database you will be prompted to create the first user.

### Useful commands

```bash
# Run type checking
pnpm typecheck

# Run unit tests
pnpm test

# Lint
pnpm lint

# Rebuild and restart just the app container
docker compose build app && docker compose up -d --force-recreate app

# View app logs
docker compose logs -f app

# Open a Postgres shell
docker compose exec postgres psql -U agomoni -d agomoni_run
```

---

## Project structure

```
app/
  (frontend)/        Public-facing pages (home, gallery, register, results)
  (studio)/          Custom CMS admin (replaces Payload's default admin UI)
  (payload)/         Payload API route handler
  api/               Custom API routes (health, photo source proxy)
collections/         Payload collection configs (Media, Users, Sponsors, etc.)
components/
  public/            Public site UI components
  studio/            Studio admin UI components
  ui/                Shared shadcn/ui primitives
globals/             Payload global configs (SiteSettings, Navigation)
lib/                 Shared utilities (env validation, storage, auth, site data)
migrations/          Drizzle/Payload database migrations
docker/              Caddyfile (reverse proxy config)
public/              Static assets (icon.svg, apple-icon.png)
```

---

## Environment variables

Full reference — see `.env.example` for the template.

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `PAYLOAD_SECRET` | Yes | JWT signing secret, min 32 chars |
| `NEXT_PUBLIC_SITE_URL` | Yes | Public origin, e.g. `https://agomonirun.in` |
| `APP_INTERNAL_URL` | Yes | Internal Docker network URL for imgproxy source (`http://app:3000`) |
| `POSTGRES_DB` | Yes | Postgres database name |
| `POSTGRES_USER` | Yes | Postgres username |
| `POSTGRES_PASSWORD` | Yes | Postgres password |
| `STORAGE_ROOT` | Yes | Absolute path for uploaded photo files |
| `UPLOAD_MAX_BYTES` | No | Max upload size in bytes (default 15 MB) |
| `STORAGE_RESERVE_BYTES` | No | Minimum free disk reserve (default 10 GB) |
| `IMGPROXY_BASE_URL` | No | Internal imgproxy URL (default `http://imgproxy:8080`) |
| `IMGPROXY_PUBLIC_URL` | No | Public imgproxy URL (default `http://localhost:8080`) |
| `IMGPROXY_KEY` | Prod only | 64-char hex key for URL signing — required in production |
| `IMGPROXY_SALT` | Prod only | 64-char hex salt for URL signing — required in production |
| `SITE_DOMAIN` | Prod only | Primary domain for Caddy, e.g. `agomonirun.in` |
| `IMAGE_DOMAIN` | Prod only | Images subdomain for Caddy, e.g. `images.agomonirun.in` |
| `ACME_EMAIL` | Prod only | Email for Let's Encrypt certificate notifications |
| `GOOGLE_DRIVE_API_KEY` | No | Google Cloud API key for public Drive imports |
| `GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON` | No | Full service account JSON (single line) for private Drive imports |

---

## Production deployment

See [DEPLOY.md](./DEPLOY.md) for the full step-by-step production guide.
