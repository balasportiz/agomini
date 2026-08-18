/**
 * Server-side Payload REST base URL.
 * The frontend never runs Payload — it always talks to the backend origin.
 */
export function getServerApiBase(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
  return raw.replace(/\/$/, "");
}

export function payloadTokenFromCookie(cookieHeader: string): string | null {
  const match = cookieHeader.match(/(?:^|;\s*)(?:payload-token|__Host-payload-token)=([^;]+)/i);
  if (!match?.[1]) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

/**
 * Next.js/undici can strip Cookie on cross-origin server fetches.
 * Payload accepts the same session as Authorization: JWT <token>.
 */
export function payloadAuthHeaders(cookieHeader: string): HeadersInit {
  const headers: Record<string, string> = {};
  if (cookieHeader) headers.Cookie = cookieHeader;
  const token = payloadTokenFromCookie(cookieHeader);
  if (token) headers.Authorization = `JWT ${token}`;
  return headers;
}

/** Origins the browser should see (media file URLs). */
export function getPublicApiBase(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001";
  return raw.replace(/\/$/, "");
}
