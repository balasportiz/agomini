import { z } from "zod";

const siteOrigin = z.string().url().superRefine((value, context) => {
  const url = new URL(value);
  if (url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "must be an origin without credentials, path, query, or fragment" });
  }
});

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  PAYLOAD_SECRET: z.string().min(32, "PAYLOAD_SECRET must be at least 32 characters"),
  NEXT_PUBLIC_SITE_URL: siteOrigin.default("http://localhost:3000"),
  APP_INTERNAL_URL: z.string().url().default("http://localhost:3000"),
  STORAGE_ROOT: z.string().min(1).default("./storage/photos"),
  UPLOAD_MAX_BYTES: z.coerce.number().int().positive().default(15_728_640),
  STORAGE_RESERVE_BYTES: z.coerce.number().int().positive().default(10_737_418_240),
  IMGPROXY_BASE_URL: z.string().url().default("http://imgproxy:8080"),
  IMGPROXY_PUBLIC_URL: z.string().url().default("http://localhost:8080"),
  IMGPROXY_KEY: z.string().default(""),
  IMGPROXY_SALT: z.string().default(""),
  // Google Drive photo import. Both are optional and independent:
  // - GOOGLE_DRIVE_API_KEY unlocks importing from files/folders shared "Anyone with the link" (no OAuth).
  // - GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON (the JSON key file's contents, as a single-line string) unlocks
  //   importing from private Drive files/folders that have been shared with the service account's email.
  GOOGLE_DRIVE_API_KEY: z.string().default(""),
  GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON: z.string().default(""),
}).superRefine((env, context) => {
  if (env.NODE_ENV !== "production") return;
  if (!env.IMGPROXY_KEY) context.addIssue({ code: z.ZodIssueCode.custom, path: ["IMGPROXY_KEY"], message: "IMGPROXY_KEY is required in production" });
  if (!env.IMGPROXY_SALT) context.addIssue({ code: z.ZodIssueCode.custom, path: ["IMGPROXY_SALT"], message: "IMGPROXY_SALT is required in production" });
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function parseServerEnv(input: NodeJS.ProcessEnv | Record<string, string | undefined>): ServerEnv {
  const result = serverEnvSchema.safeParse(input);
  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `${issue.path.join(".") || "environment"}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid server environment: ${details}`);
  }
  return result.data;
}

let cached: ServerEnv | undefined;

export function getServerEnv(): ServerEnv {
  cached ??= parseServerEnv(process.env);
  return cached;
}
