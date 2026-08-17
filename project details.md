# Agomoni Run 2.0 — Production Website and CMS Specification

## Product

Transform the existing EVASION source repository into the production website and CMS for **Agomoni Run 2.0**, organised by **Barasat Runners**.

- Event date: Sunday, 4 October 2026
- Timezone: Asia/Kolkata
- Default venue: Barasat, Subhash Maidan, West Bengal
- Theme: women’s safety, community strength, Bengal’s festive spirit, and the symbolic welcome of Maa Durga

The implementation must preserve EVASION’s strongest visual qualities—cinematic photography, oversized typography, floating navigation, spacious composition and authored motion—while removing every e-commerce concept.

## Approved production architecture

This specification supersedes the former MongoDB, Better Auth and Telegram-storage plan.

- Next.js App Router with strict TypeScript
- React Server Components by default; Client Components only for interaction
- Existing Tailwind CSS 4 and shadcn/ui system
- Payload CMS integrated into the Next.js application
- Payload authentication and access control for administrators
- PostgreSQL as the application and CMS database
- Persistent local photo storage on an attached OCI block volume
- imgproxy for responsive image transformation and delivery
- Docker Compose for deployment on one Oracle Cloud Always Free Ampere VM
- Caddy as TLS reverse proxy
- Vitest for unit/integration tests and Playwright for critical browser flows

Do not add MongoDB, Better Auth, Telegram storage, Prisma, Mongoose, Supabase or Firebase. Do not deploy Kubernetes/K3s on the Free Tier host.

## Oracle Free Tier deployment constraints

Use one VM, one approximately 50 GB boot volume and one approximately 150 GB attached data volume. All persistent data must live under `/mnt/data`, never inside an ephemeral container filesystem.

Suggested allocation:

- PostgreSQL: 10–15 GB
- Photo originals: 100–115 GB
- Temporary uploads and image cache: 10–15 GB
- Logs and safety margin: 10–15 GB

Operational requirements:

- Maximum upload size: 15 MB
- JPEG, PNG and WebP only
- Normalize large images to a configurable maximum long edge
- Keep one original; do not permanently store every thumbnail variant
- Bound imgproxy cache size
- Warn at 70% disk use, alert at 80%, and reject uploads before 90%
- Nightly PostgreSQL dumps, rotating OCI block-volume backups and a weekly off-site photo backup
- Application and Docker images must support ARM64

## Environment variables

Create and document `.env.example`:

```env
DATABASE_URL=postgresql://agomoni:change-me@postgres:5432/agomoni_run
PAYLOAD_SECRET=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
STORAGE_ROOT=/mnt/data/photos
UPLOAD_MAX_BYTES=15728640
IMGPROXY_BASE_URL=http://imgproxy:8080
IMGPROXY_PUBLIC_URL=http://localhost:8080
IMGPROXY_KEY=
IMGPROXY_SALT=
POSTGRES_DB=agomoni_run
POSTGRES_USER=agomoni
POSTGRES_PASSWORD=
```

Never expose `DATABASE_URL`, `PAYLOAD_SECRET`, database credentials, imgproxy signing material or filesystem paths to browser code. Validate server configuration with clear development errors.

## Content and data model

Configure Payload collections/globals for:

### Administrators

- Payload-authenticated users only
- Public account creation disabled
- First administrator created through Payload’s controlled initial setup
- Later administrators created only by an existing administrator
- Secure cookies and production-safe session settings

### Site settings global

- Event name, tagline, date/time, timezone and venue
- Organiser name and description
- Hero heading, supporting copy and hero photo
- Registration URL, results URL and registration status
- Contact email, phone/WhatsApp values and social links
- Announcement enabled/text/link
- About and organiser content
- Gallery title and description
- Footer and optional configured partner fields

### Race categories

- Name, distance, fee, reporting time and flag-off time
- Description, optional eligibility and inclusions
- Display order and active state
- Created and updated timestamps

Seed 5K, 10K and 15K with clearly labelled editable placeholder fees/times. Never invent final event details.

### Highlights, FAQs and sponsors

Store these as independently editable ordered content with active/inactive states. Do not invent sponsor names, policies or partnerships.

### Photos

- Original file reference stored under `STORAGE_ROOT`
- Caption, alt text and optional tags
- Width, height, MIME type and byte size
- Display order, active and featured states
- Hero eligibility
- Created/updated timestamps and uploader reference

Use database IDs and server-resolved paths. Never accept a client-supplied filesystem path.

## Public routes

### `/`

Include:

1. Optional announcement banner
2. Floating navigation with Home, Categories, About, Highlights, Gallery, FAQ and Contact
3. Register and Results actions using internal routes
4. Cinematic AGOMONI / RUN 2.0 hero
5. Stable server-rendered countdown enhanced after hydration
6. Ordered active race categories
7. About the Run and Barasat Runners content
8. Editable event highlights
9. One or two immersive image-led story sections
10. Six to eight active gallery photos
11. Sponsor strip or “Partners to be announced” state
12. FAQ accordion
13. Contact details
14. Mid-page, final and mobile sticky conversion actions
15. Complete event footer

### `/gallery`

Provide an ordered responsive grid, count, captions, loading/empty states and a keyboard-accessible lightbox with previous/next controls, Escape-to-close, focus restoration and practical mobile swipe support.

### `/register` and `/results`

Read destinations from current settings. Redirect temporarily only to valid HTTP/HTTPS URLs. Otherwise render polished opening-soon/results-pending pages. Reject malformed, `javascript:` and `data:` destinations.

## Event-state behavior

Store one canonical event instant and the IANA timezone. Render a stable initial state on the server and update the countdown client-side.

- Before start: Register is primary
- At start: “The run is underway”
- After completion: “Race completed” and Results becomes primary

All event-state, URL and form logic must have deterministic tests.

## Photo upload and delivery

### Upload

- Admin authentication and collection access are mandatory
- Validate declared MIME type, magic bytes and size
- Use collision-resistant server-generated storage keys
- Prevent path traversal and executable uploads
- Write to a temporary file, validate/process, then atomically move to persistent storage
- Return per-file success/failure for batches
- Bound upload concurrency
- Reject uploads safely when disk reserve would be breached
- Preserve successful files when another file in the batch fails

### Delivery

- Browser requests use database photo IDs, not physical paths
- imgproxy transformation URLs must be signed
- Original-source access must resolve only database-backed photo records
- Add immutable or long-lived caching for versioned images
- Set correct MIME type, ETag and stale-while-revalidate behavior
- Deleting a record removes it publicly; physical deletion must be consistent and recoverable

## Admin experience

Use Payload’s admin panel and access controls as the primary CMS. Add custom fields, validation, descriptions, previews and ordering controls where required. Do not rebuild a second parallel admin dashboard unless a requested workflow cannot be delivered cleanly through Payload.

The admin must support:

- Event/settings editing
- Category CRUD, activation and ordering
- Hero/About/organiser editing
- Highlight, FAQ and sponsor management
- Photo batch upload, metadata editing, activation, featuring, ordering and hero selection
- Dashboard links to the public site, registration and results
- Clear validation, loading, success, failure and empty states

## Design system

Brand voice: kinetic, resolute and communal.

Use:

- Deep charcoal primary surfaces
- Neutral off-white
- Vermilion/sindoor red as the primary action accent
- Antique gold only for fine details
- Restrained deep blue for utility/timing information
- Real event and running photography
- Subtle Maa Durga eye, route-line, bib and kilometre motifs

Avoid generic beige templates, neon gradients, repeated icon-card grids, excessive glassmorphism, fabricated social proof and crowded layouts.

Typography must use licensed, loaded font files with strong Latin readability and verified Bengali glyph support where Bengali display text appears. Do not retain unloaded `PP Editorial New` declarations.

Motion must include reduced-motion alternatives and must not gate content visibility. Prefer CSS and Intersection Observer; use a client animation library only when it materially improves an interaction.

## Accessibility, SEO and performance

- Semantic landmarks and one meaningful H1
- Logical heading order and descriptive alt text
- Keyboard-accessible navigation, dialogs and lightbox
- Visible focus, sufficient contrast and touch-friendly targets
- `aria-live` for meaningful upload/status feedback
- Responsive checks at 360, 390, 768, 1024 and 1440+ pixels
- No horizontal overflow or severe image layout shift
- Page metadata, canonical URL, Open Graph, Twitter/X, icons, `robots.ts`, `sitemap.ts` and Event structured data
- Server Components for database-rendered public content
- Priority only for the actual hero/LCP image
- Responsive image sizes and explicit aspect ratios
- No autoplay audio or huge background video

## Security

- Validate all external inputs with Zod and Payload field hooks
- Enforce access control server-side for every mutation and upload
- Use parameterized database operations through Payload’s PostgreSQL adapter
- Set secure, HTTP-only, same-site cookies
- Add CSP, HSTS, frame, content-type and referrer headers
- Rate-limit authentication and upload endpoints
- Never expose stack traces, storage paths or secrets
- Never trust hidden form fields for authorization
- Backups must be encrypted where practical and restoration must be tested

## Development and deployment

Use Docker Compose locally and in production. Required services:

- `app`: Next.js and Payload
- `postgres`: PostgreSQL with persistent storage
- `imgproxy`: signed image transformations
- `caddy`: production TLS reverse proxy

Do not place PostgreSQL or photos on Docker’s writable container layer. Production compose mounts `/mnt/data/postgres`, `/mnt/data/photos`, `/mnt/data/cache` and `/mnt/data/backups`.

Provide:

- Multi-stage ARM64-compatible `Dockerfile`
- Development and production Compose configuration
- Health checks and restart policies
- Caddy configuration
- Database dump/restore scripts
- Disk-usage check script
- Deployment and rollback documentation

## Required project structure

Adapt to Payload conventions while keeping public code modular:

```text
app/
  (frontend)/
  (payload)/
  api/
  gallery/
  register/
  results/
components/
  public/
  gallery/
  ui/
collections/
globals/
lib/
  env.ts
  event-state.ts
  redirects.ts
  media.ts
  image-url.ts
tests/
  unit/
  integration/
docker/
scripts/
```

## Verification and completion criteria

Before completion:

1. Install pinned dependencies with pnpm.
2. Run unit and integration tests.
3. Run strict TypeScript checks.
4. Run ESLint.
5. Run the production build.
6. Test Payload first-admin creation, login/logout and route protection.
7. Test category and content management.
8. Test photo upload validation, disk reserve behavior and image delivery.
9. Test `/register`, `/results` and event-state transitions.
10. Test navigation, responsive layouts and gallery lightbox.
11. Confirm no commerce copy, product assets or dead imports remain.
12. Confirm no secrets or physical storage paths enter client bundles.
13. Verify Docker Compose service health on ARM64-compatible images.
14. Document anything requiring external credentials or an actual OCI host that could not be exercised locally.

Create/update `README.md` with local setup, Payload initialization, PostgreSQL, storage layout, imgproxy signing, environment variables, Docker Compose, Oracle deployment, backups, restoration, changing registration/results links and troubleshooting.

The public site must remain polished when optional content is absent and must fail safely when database, storage or image transformation services are unavailable.