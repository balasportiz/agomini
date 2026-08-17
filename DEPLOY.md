# Production Deployment Guide

This guide covers deploying Agomoni Run 2.0 to an **Oracle Cloud Always Free** Arm instance (2 OCPU / 12 GB RAM) running Ubuntu 22.04. The same steps work on any Ubuntu/Debian VPS.

---

## Architecture

```
Internet
   │
   ▼
Caddy (ports 80/443) — auto TLS via Let's Encrypt
   │
   ├── agomonirun.in  ──────▶  app:3000  (Next.js + Payload)
   └── images.agomonirun.in ─▶  imgproxy:8080
                                    │
                                    └── reads photos from /mnt/data/photos
                                    
app:3000 ◀──── postgres:5432  (internal network only, port not exposed)
app:3000 ──── /mnt/data/photos  (bind mount)
pgbackups ─── /mnt/data/backups  (daily dumps, 7-day rotation)
```

All services run in a single Docker Compose stack using two compose files:

- `docker-compose.yml` — base config
- `docker-compose.prod.yml` — production overrides (closes Postgres port, uses `/mnt/data` paths)

---

## Prerequisites

- Ubuntu 22.04 VPS with a public IP
- A domain pointed at the VPS IP (`agomonirun.in` and `images.agomonirun.in` as A records)
- DNS propagated before running Caddy (it requests TLS certificates on first start)
- Ports 80, 443 open in the VPS firewall/security group

---

## 1. Provision the server

### Create the data directory on a mounted volume

```bash
sudo mkdir -p /mnt/data/{postgres,photos,backups,cache}
sudo chown -R $USER:$USER /mnt/data
```

If your Oracle instance has a separate block volume, mount it at `/mnt/data` before this step.

### Install Docker

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
newgrp docker          # apply group change without logout
docker --version       # confirm
```

---

## 2. Deploy the code

```bash
git clone https://github.com/balasportiz/agomini.git /srv/agomoni
cd /srv/agomoni
```

To update an existing deployment later:

```bash
cd /srv/agomoni
git pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml build app migrate
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --force-recreate app migrate
```

---

## 3. Configure environment

```bash
cp .env.example .env
nano .env           # or use any editor you prefer
```

Set every value. Critical ones for production:

```env
# Database
POSTGRES_DB=agomoni_run
POSTGRES_USER=agomoni
POSTGRES_PASSWORD=<strong-random-password>

# App
DATABASE_URL=postgresql://agomoni:<strong-random-password>@postgres:5432/agomoni_run
PAYLOAD_SECRET=<at-least-32-random-characters>
NEXT_PUBLIC_SITE_URL=https://agomonirun.in
APP_INTERNAL_URL=http://app:3000
STORAGE_ROOT=/mnt/data/photos
UPLOAD_MAX_BYTES=15728640
STORAGE_RESERVE_BYTES=10737418240

# imgproxy — generate with: openssl rand -hex 32
IMGPROXY_BASE_URL=http://imgproxy:8080
IMGPROXY_PUBLIC_URL=https://images.agomonirun.in
IMGPROXY_KEY=<64-char-hex>
IMGPROXY_SALT=<64-char-hex>

# Caddy
SITE_DOMAIN=agomonirun.in
IMAGE_DOMAIN=images.agomonirun.in
ACME_EMAIL=your@email.com
```

Generate secrets:

```bash
# PAYLOAD_SECRET
openssl rand -base64 48

# IMGPROXY_KEY and IMGPROXY_SALT (run twice, use each output separately)
openssl rand -hex 32
```

Lock the file to the current user:

```bash
chmod 600 .env
```

---

## 4. Build and start

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml --profile production up -d --build
```

What this does:

1. Builds the app image (`target: runner`) and migration image
2. Starts Postgres
3. Runs `pnpm migrate` (applies any pending schema changes)
4. Starts the app, imgproxy, pgbackups, and Caddy
5. Caddy requests TLS certificates from Let's Encrypt automatically

First build takes ~3 minutes. Monitor progress:

```bash
docker compose logs -f
```

---

## 5. Verify

```bash
# Health check
curl -f https://agomonirun.in/api/health

# Check all containers are up
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps

# Check Caddy got certificates
docker compose logs caddy | grep -i certificate
```

Open `https://agomonirun.in` in a browser — it should load over HTTPS with a valid certificate.

Create the first admin account at `https://agomonirun.in/studio`.

---

## 6. Configure DNS

Two A records are needed:

| Hostname | Type | Value |
|---|---|---|
| `agomonirun.in` | A | `<VPS public IP>` |
| `images.agomonirun.in` | A | `<VPS public IP>` |

If you are using a subdomain for the site (e.g. `run.agomonirun.in`) adjust `SITE_DOMAIN` in `.env` and your DNS accordingly.

---

## 7. Set up a systemd service (auto-start on reboot)

```bash
sudo nano /etc/systemd/system/agomoni.service
```

Paste:

```ini
[Unit]
Description=Agomoni Run Docker Compose stack
Requires=docker.service
After=docker.service network-online.target

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/srv/agomoni
ExecStart=/usr/bin/docker compose -f docker-compose.yml -f docker-compose.prod.yml --profile production up -d
ExecStop=/usr/bin/docker compose -f docker-compose.yml -f docker-compose.prod.yml --profile production down
TimeoutStartSec=300

[Install]
WantedBy=multi-user.target
```

Enable it:

```bash
sudo systemctl daemon-reload
sudo systemctl enable agomoni.service
sudo systemctl start agomoni.service
```

---

## Updating the site

Every time you push code changes, run on the VPS:

```bash
cd /srv/agomoni
git pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml --profile production build app
docker compose -f docker-compose.yml -f docker-compose.prod.yml --profile production up -d --force-recreate app
```

If there are database migrations in the update:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml run --rm migrate
```

---

## Backups

Daily Postgres dumps are written automatically by the `pgbackups` service to `/mnt/data/backups`. Retention policy:

- **7 daily** backups
- **4 weekly** backups  
- **6 monthly** backups

To restore from a backup:

```bash
# List available backups
ls /mnt/data/backups/

# Restore (this replaces all current data)
docker compose exec -T postgres psql -U agomoni -d agomoni_run \
  < /mnt/data/backups/last/agomoni_run-latest.sql.gz
```

Photo files are in `/mnt/data/photos`. Back these up separately with `rsync` or an object storage sync tool — they are not included in the Postgres dump.

---

## Monitoring

```bash
# Live resource usage
docker stats

# App logs (last 100 lines, then follow)
docker compose logs --tail=100 -f app

# Postgres logs
docker compose logs --tail=50 postgres

# Caddy logs (TLS renewals, access errors)
docker compose logs --tail=50 caddy
```

---

## Firewall (Oracle Cloud)

In the Oracle Cloud Console, update the **Security List** or **Network Security Group** for your subnet:

| Direction | Protocol | Port | Source |
|---|---|---|---|
| Ingress | TCP | 80 | 0.0.0.0/0 |
| Ingress | TCP | 443 | 0.0.0.0/0 |
| Ingress | UDP | 443 | 0.0.0.0/0 |

Also update the OS firewall on the instance:

```bash
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p udp --dport 443 -j ACCEPT
sudo netfilter-persistent save
```

Ports 3000, 5432, and 8080 are not exposed publicly — they are internal to the Docker network.

---

## Oracle Always Free limits (as of July 2026)

| Resource | Free allowance |
|---|---|
| Compute (Arm A1) | 2 OCPU, 12 GB RAM |
| Block storage | 200 GB |
| Egress bandwidth | 10 TB / month |
| Inbound bandwidth | Unlimited |

The app idles at ~210 MB RAM (app) + ~50 MB (Postgres) + ~32 MB (imgproxy). Total ~300 MB, well within the 12 GB limit.

> **Important:** Oracle reclaims Always Free instances that stay below 20% CPU, 20% memory, and 20% network utilisation for 7 consecutive days. Keep the instance active by ensuring real traffic or by scheduling a lightweight cron job.

---

## Troubleshooting

**Caddy fails to get a certificate**
- Confirm DNS A records resolve to the VPS IP (`dig agomonirun.in`)
- Confirm ports 80 and 443 are open in Oracle's security group and OS firewall
- Check logs: `docker compose logs caddy`

**App returns 502**
- The app container may still be starting. Wait ~30 seconds and retry.
- Check: `docker compose ps` — all services should show `healthy`
- Check: `docker compose logs app`

**Database migrations fail on update**
- Run migrations manually: `docker compose -f docker-compose.yml -f docker-compose.prod.yml run --rm migrate`
- Check Postgres is healthy: `docker compose exec postgres pg_isready`

**Photos not loading**
- Confirm `/mnt/data/photos` exists and is writable by the container user
- Check imgproxy logs: `docker compose logs imgproxy`
- Confirm `IMGPROXY_KEY` and `IMGPROXY_SALT` in `.env` match what was used when photos were uploaded
