/**
 * Server-side Payload REST base URL.
 *
 * On Vercel, Studio talks to Render via NEXT_PUBLIC_API_URL.
 * On Render (this app is the API), fetch loopback so we never hairpin through
 * the public hostname. Fetching https://agomonirun.com from inside the
 * container often fails or drops the session after login.
 */
export function getServerApiBase(): string {
  if (process.env.VERCEL && process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "");
  }
  const port = process.env.PORT ?? "3000";
  return `http://127.0.0.1:${port}`;
}

/** Origins the browser should see (media file URLs, CORS). */
export function getPublicApiBase(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return raw.replace(/\/$/, "");
}
