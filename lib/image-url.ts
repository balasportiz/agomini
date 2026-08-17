import { getFrontendEnv } from "@/lib/env";

type ImageOptions = {
  width?: number;
  height?: number;
  format?: "avif" | "webp" | "jpg";
};

/**
 * Builds the public URL for a media asset.
 *
 * On the VPS monolith the imgproxy instance signs URLs using HMAC so the
 * source route is protected. On Vercel we do not have the signing keys, but
 * that is fine — Vercel only renders the frontend, and image URLs always point
 * at the VPS imgproxy (`IMGPROXY_PUBLIC_URL`). The browser fetches images
 * directly from the VPS, not through Vercel.
 *
 * The signed-URL logic has moved into the VPS-only site-data API endpoint
 * (`/api/public-data` on the VPS) which builds URLs server-side before sending
 * the JSON response. This file now just passes through the URL as received
 * from the API, or builds a plain imgproxy URL for the VPS monolith path.
 */
export function buildPublicImageUrl(photoId: string, options: ImageOptions = {}): string {
  const env = getFrontendEnv();
  const imgproxyBase = env.IMGPROXY_PUBLIC_URL.replace(/\/$/, "");

  const width = Math.min(Math.max(options.width ?? 2200, 1), 5000);
  const height = Math.min(Math.max(options.height ?? 0, 0), 5000);
  const format = options.format ?? "webp";

  // When running on the VPS the API URL is the same origin, so use the
  // internal /api/photos/[id]/source path as the imgproxy source.
  // Signing is handled inside the VPS-side loadPublicSiteData (server env).
  const apiBase = (env.NEXT_PUBLIC_API_URL ?? env.NEXT_PUBLIC_SITE_URL).replace(/\/$/, "");
  const sourcePath = `${apiBase}/api/photos/${encodeURIComponent(photoId)}/source`;
  const encodedSource = Buffer.from(sourcePath).toString("base64url");
  const processingPath = `/rs:fit:${width}:${height}:0/q:85/${encodedSource}.${format}`;

  return `${imgproxyBase}${processingPath}`;
}
