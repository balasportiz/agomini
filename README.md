# Agomoni Run — monorepo

```
frontend/   → Vercel (public website + Studio UI)
backend/    → Render (Payload CMS + REST API + photos)
```

## Local development

```bash
pnpm install
cp frontend/.env.example frontend/.env.local
cp backend/.env.example backend/.env

pnpm dev          # frontend :3000 + backend :3001
pnpm dev:frontend # frontend only
pnpm dev:backend  # backend only
```

Studio and the public site call the backend through `NEXT_PUBLIC_API_URL` (default `http://localhost:3001`).

## Deploy

| Package | Platform | Root directory |
|---------|----------|----------------|
| `frontend/` | **Vercel** | Set **Root Directory** to `frontend` |
| `backend/` | **Render** | Set **Root Directory** to `backend` (or use `backend/render.yaml`) |

### Vercel (`frontend/`)

```
NEXT_PUBLIC_SITE_URL=https://agomonirun.com
NEXT_PUBLIC_API_URL=https://<your-render-service>.onrender.com
```

### Render (`backend/`)

```
DATABASE_URL=...
PAYLOAD_SECRET=...
NEXT_PUBLIC_SITE_URL=https://agomonirun.com
NEXT_PUBLIC_API_URL=https://<your-render-service>.onrender.com
S3_* (R2)
```

See `backend/.env.example` and `DEPLOY.md` for the full list.
