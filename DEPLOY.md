# Deployment Guide

This project uses a split deployment:

| Layer | Platform | Cost |
|---|---|---|
| Frontend (public site + Studio) | **Vercel** | Free |
| Backend (Payload CMS + API) | **Render** (now) → **Oracle VPS** (production) | Free now, self-hosted later |
| Database | Local Docker (dev) → **Supabase** (optional) → **Oracle Postgres** (prod) | Free |
| Photos | **Cloudflare R2** | Free up to 10 GB |

---

## Part 1 — Backend on Render (current free setup)

### What Render runs

Render builds your `Dockerfile` and runs a single container:
- Migrations run automatically on every deploy (`pnpm migrate`)
- App starts on the port Render assigns (`PORT` env var)
- Render handles TLS — no Caddy needed
- No Postgres container — connect to an external database via `DATABASE_URL`

### Step 1 — Connect the GitHub repo

1. Go to [render.com](https://render.com) → New → Web Service
2. Connect your GitHub account and select `balasportiz/agomini`
3. Render detects `render.yaml` automatically — click **Apply**

Or manually:
- **Runtime:** Docker
- **Dockerfile path:** `./Dockerfile`
- **Branch:** `main`
- **Plan:** Free

### Step 2 — Set environment variables

In Render dashboard → your service → **Environment** → add each variable:

```
DATABASE_URL          postgresql://user:pass@host:5432/db?sslmode=require
PAYLOAD_SECRET        <at least 32 random characters>
NEXT_PUBLIC_SITE_URL  https://agomoni-backend.onrender.com
APP_INTERNAL_URL      http://localhost:3000
STORAGE_ROOT          ./storage/photos
NODE_ENV              production

# Cloudflare R2
S3_ENDPOINT           https://4229c83669f0f7a0311f13c4974cdeae.r2.cloudflarestorage.com
S3_BUCKET             agomonirun
S3_ACCESS_KEY_ID      <your R2 access key>
S3_SECRET_ACCESS_KEY  <your R2 secret key>
S3_PUBLIC_URL         https://pub-xxxx.r2.dev

# Google Drive import (optional — leave empty to disable)
GOOGLE_DRIVE_API_KEY              
GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON 
```

> **Note:** `IMGPROXY_*` vars are not needed — photos are served directly from R2.

### Step 3 — Build args (baked into the image)

In Render dashboard → your service → **Environment** → **Build & Deploy** section, add:

```
NEXT_PUBLIC_SITE_URL   https://agomoni-backend.onrender.com
IMGPROXY_PUBLIC_URL    http://localhost:8080
```

These are passed as Docker build args so `NEXT_PUBLIC_SITE_URL` is baked into the Next.js bundle at build time.

### Step 4 — Deploy

Click **Deploy** (or push to `main` — autoDeploy is enabled in `render.yaml`).

Watch the build log. First build takes ~4 minutes. Look for:
```
==> Starting service with 'sh -c pnpm migrate && node server.js'
```

Then:
```
==> Your service is live at https://agomoni-backend.onrender.com
```

### Step 5 — Create the first admin account

Open `https://agomoni-backend.onrender.com/studio` and create the first user.

> **Free tier cold start:** The service sleeps after 15 minutes of inactivity. The first request after sleep takes ~30 seconds. This is expected on the free plan.

### Step 6 — Set up Vercel frontend

In Vercel dashboard → your project → **Settings → Environment Variables** add:

```
NEXT_PUBLIC_SITE_URL   https://agomoni.vercel.app
NEXT_PUBLIC_API_URL    https://agomoni-backend.onrender.com
IMGPROXY_PUBLIC_URL    http://localhost:8080
```

Then redeploy Vercel so it picks up `NEXT_PUBLIC_API_URL`.

---

## Part 2 — Database options

### Option A — Use Render's free PostgreSQL (easiest, expires in 90 days)

1. Render dashboard → New → PostgreSQL → Free plan
2. Copy the **Internal Database URL** 
3. Set it as `DATABASE_URL` in your web service environment

> ⚠️ Render's free PostgreSQL is **deleted after 90 days**. Use for testing only.

### Option B — Supabase (free forever, recommended for now)

1. Go to [supabase.com](https://supabase.com) → New project
2. Settings → Database → **Connection string** → copy the URI
3. Add `?sslmode=require` to the end if not already present
4. Set as `DATABASE_URL` in Render environment variables

Connection string shape:
```
postgresql://postgres.xxxx:password@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require
```

> Supabase free tier pauses the database after 1 week of inactivity. It resumes automatically on the next connection (~1 second).

### Option C — Local Docker Compose (development only)

```bash
docker compose up postgres -d
```

`DATABASE_URL=postgresql://agomoni:local-dev-password@localhost:5432/agomoni_run`

---

## Part 3 — Future: full Oracle VPS deployment

When you're ready to move everything to Oracle Always Free (2 OCPU / 12 GB ARM):

### Architecture on Oracle VPS

```
Internet
   │
   ▼
Caddy (ports 80/443) — auto TLS via Let's Encrypt
   │
   └── agomonirun.in  ──────▶  app:3000  (Next.js + Payload)

app:3000 ◀──── postgres:5432  (internal network only)
photos ──────────────────────  Cloudflare R2 (unchanged)
pgbackups ─────────────────── daily dumps to /mnt/data/backups
```

### Steps

```bash
# 1. Install Docker
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER

# 2. Clone the repo
git clone https://github.com/balasportiz/agomini.git /srv/agomoni
cd /srv/agomoni

# 3. Create .env from example
cp .env.example .env
# Edit .env — set DATABASE_URL to use the local postgres container:
# DATABASE_URL=postgresql://agomoni:<password>@postgres:5432/agomoni_run

# 4. Start everything
docker compose -f docker-compose.yml -f docker-compose.prod.yml --profile production up -d --build

# 5. Auto-start on reboot
sudo systemctl enable docker
```

The Docker Compose stack brings up Postgres, runs migrations, starts the app, imgproxy, pgbackups, and Caddy. No code changes needed — `render.yaml` is ignored by Docker Compose.

---

## Updating the deployed backend

### Render

Push to `main`. Render rebuilds and redeploys automatically.

To trigger manually: Render dashboard → your service → **Manual Deploy**.

### Oracle VPS (future)

```bash
cd /srv/agomoni
git pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml build app
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --force-recreate app
```

---

## Troubleshooting

**Render build fails with `pnpm: not found`**
- Render uses the `Dockerfile` — pnpm is installed via corepack in the `base` stage. Check the build log for the exact error.

**`pnpm migrate` fails on first deploy**
- Usually means `DATABASE_URL` is missing or wrong. Check the Render environment variables. The error message will include `connect ECONNREFUSED` or `password authentication failed`.

**Studio login redirects back to login**
- `PAYLOAD_SECRET` is missing or changed between deploys. All existing sessions are invalidated when this changes.

**Photos not loading**
- Check `S3_PUBLIC_URL` is set and the R2 Public Development URL is enabled in Cloudflare.
- Check `S3_ACCESS_KEY_ID` and `S3_SECRET_ACCESS_KEY` are correct.

**Supabase database paused**
- Go to Supabase dashboard → your project → click **Restore**. Takes ~30 seconds.
