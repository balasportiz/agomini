/**
 * Server-side Payload REST base URL.
 * The frontend never runs Payload — it always talks to the backend origin.
 */
export function getServerApiBase(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
  return raw.replace(/\/$/, "");
}

/** Origins the browser should see (media file URLs). */
export function getPublicApiBase(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001";
  return raw.replace(/\/$/, "");
}
