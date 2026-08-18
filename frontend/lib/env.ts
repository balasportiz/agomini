import { z } from "zod";

const siteOrigin = z.string().url().superRefine((value, context) => {
  const url = new URL(value);
  if (url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "must be an origin without credentials, path, query, or fragment" });
  }
});

const frontendEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NEXT_PUBLIC_SITE_URL: siteOrigin.default("http://localhost:3000"),
  NEXT_PUBLIC_API_URL: siteOrigin.default("http://localhost:3001"),
  IMGPROXY_PUBLIC_URL: z.string().url().default("http://localhost:8080"),
});

export type FrontendEnv = z.infer<typeof frontendEnvSchema>;

export function parseFrontendEnv(input: NodeJS.ProcessEnv | Record<string, string | undefined>): FrontendEnv {
  const result = frontendEnvSchema.safeParse(input);
  if (!result.success) {
    const details = result.error.issues.map((i) => `${i.path.join(".") || "environment"}: ${i.message}`).join("; ");
    throw new Error(`Invalid frontend environment: ${details}`);
  }
  return result.data;
}

let cachedFrontend: FrontendEnv | undefined;

export function getFrontendEnv(): FrontendEnv {
  cachedFrontend ??= parseFrontendEnv(process.env);
  return cachedFrontend;
}
