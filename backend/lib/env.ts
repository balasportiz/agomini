import { z } from "zod";

const siteOrigin = z.string().url().superRefine((value, context) => {
  const url = new URL(value);
  if (url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "must be an origin without credentials, path, query, or fragment" });
  }
});

const optionalOriginList = z.preprocess(
  (value) => {
    if (typeof value !== "string") return [];
    return value
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);
  },
  z.array(siteOrigin).default([]),
);

// ---------------------------------------------------------------------------
// Frontend env — validated on both Vercel and the VPS app process.
// Only contains vars that the public site and Studio UI actually need.
// ---------------------------------------------------------------------------
const frontendEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NEXT_PUBLIC_SITE_URL: siteOrigin.default("http://localhost:3000"),
  // Public base URL of the VPS (where Payload REST lives).
  // Required when the frontend runs on Vercel; optional for the VPS monolith
  // where the app IS the API (falls back to same-origin).
  NEXT_PUBLIC_API_URL: siteOrigin.optional(),
  // Public imgproxy URL — used to build image src attributes.
  IMGPROXY_PUBLIC_URL: z.string().url().default("http://localhost:8080"),
});

export type FrontendEnv = z.infer<typeof frontendEnvSchema>;

// ---------------------------------------------------------------------------
// Backend env — validated only on the VPS (payload.config.ts, API routes).
// Never imported by components or lib/site-data on Vercel.
// ---------------------------------------------------------------------------
// `next build` only needs config to load for route registration — runtime-only
// requirements (R2/imgproxy) must not fail the Docker build stage.
const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";

const backendEnvSchema = frontendEnvSchema.extend({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  PAYLOAD_SECRET: z.string().min(32, "PAYLOAD_SECRET must be at least 32 characters"),
  APP_INTERNAL_URL: z.string().url().default("http://localhost:3000"),
  FRONTEND_ALLOWED_ORIGINS: optionalOriginList,
  STORAGE_ROOT: z.string().min(1).default("./storage/photos"),
  UPLOAD_MAX_BYTES: z.coerce.number().int().positive().default(15_728_640),
  STORAGE_RESERVE_BYTES: z.coerce.number().int().positive().default(10_737_418_240),
  IMGPROXY_BASE_URL: z.string().url().default("http://imgproxy:8080"),
  IMGPROXY_KEY: z.string().default(""),
  IMGPROXY_SALT: z.string().default(""),
  GOOGLE_DRIVE_API_KEY: z.string().default(""),
  GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON: z.string().default(""),
  // Cloudflare R2 (S3-compatible). All four must be set to enable R2 storage.
  // Leave S3_BUCKET empty to keep using local disk (default for Docker/VPS).
  S3_ENDPOINT: z.string().min(1).optional(),
  // Account ID is required when S3_ENDPOINT is the bare host r2.cloudflarestorage.com
  S3_ACCOUNT_ID: z.string().min(1).optional(),
  S3_BUCKET: z.string().default(""),
  S3_ACCESS_KEY_ID: z.string().default(""),
  S3_SECRET_ACCESS_KEY: z.string().default(""),
  // Public base URL for R2 objects, e.g. https://pub-xxxx.r2.dev
  // or a custom domain you've configured in Cloudflare.
  S3_PUBLIC_URL: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().url().optional(),
  ),
}).superRefine((env, context) => {
  if (env.NODE_ENV !== "production" || isBuildPhase) return;
  const r2Active = Boolean(env.S3_ENDPOINT && env.S3_BUCKET && env.S3_ACCESS_KEY_ID && env.S3_SECRET_ACCESS_KEY && env.S3_PUBLIC_URL);
  // When R2 is the storage backend, imgproxy signing is optional because
  // images are served directly from the R2 public URL.
  if (!r2Active) {
    if (!env.IMGPROXY_KEY) context.addIssue({ code: z.ZodIssueCode.custom, path: ["IMGPROXY_KEY"], message: "IMGPROXY_KEY is required in production when not using R2 storage" });
    if (!env.IMGPROXY_SALT) context.addIssue({ code: z.ZodIssueCode.custom, path: ["IMGPROXY_SALT"], message: "IMGPROXY_SALT is required in production when not using R2 storage" });
  }
});

export type ServerEnv = z.infer<typeof backendEnvSchema>;

export function parseFrontendEnv(input: NodeJS.ProcessEnv | Record<string, string | undefined>): FrontendEnv {
  const result = frontendEnvSchema.safeParse(input);
  if (!result.success) {
    const details = result.error.issues.map((i) => `${i.path.join(".") || "environment"}: ${i.message}`).join("; ");
    throw new Error(`Invalid frontend environment: ${details}`);
  }
  return result.data;
}

export function parseServerEnv(input: NodeJS.ProcessEnv | Record<string, string | undefined>): ServerEnv {
  const result = backendEnvSchema.safeParse(input);
  if (!result.success) {
    const details = result.error.issues.map((i) => `${i.path.join(".") || "environment"}: ${i.message}`).join("; ");
    throw new Error(`Invalid server environment: ${details}`);
  }
  return result.data;
}

let cachedFrontend: FrontendEnv | undefined;
let cachedBackend: ServerEnv | undefined;

/** Safe on Vercel — only reads public/image env vars, no DB or secrets. */
export function getFrontendEnv(): FrontendEnv {
  cachedFrontend ??= parseFrontendEnv(process.env);
  return cachedFrontend;
}

/** VPS-only — will throw on Vercel if DATABASE_URL/PAYLOAD_SECRET are missing. */
export function getServerEnv(): ServerEnv {
  cachedBackend ??= parseServerEnv(process.env);
  return cachedBackend;
}
