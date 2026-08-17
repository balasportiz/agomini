import { getFrontendEnv } from "@/lib/env";

type ImageOptions = {
  width?: number;
  height?: number;
  format?: "avif" | "webp" | "jpg";
};

/**
 * Builds the public URL for a media asset.
 *
 * Storage modes:
 *
 * 1. R2 active (S3_PUBLIC_URL is set on the backend):
 *    The photo source route returns a 302 redirect to the R2 public URL.
 *    Images are served directly from Cloudflare's edge — no imgproxy needed.
 *    The URL shape is: {S3_PUBLIC_URL}/{filename}
 *    Since we only store UUID filenames in the DB (not the public URL), we
 *    still route through /api/photos/[id]/source which does the DB lookup
 *    and redirects to R2. This keeps the public interface identical whether
 *    R2 or local disk is in use.
 *
 * 2. Local disk + imgproxy (IMGPROXY_PUBLIC_URL is set):
 *    Routes through imgproxy for resizing/optimisation.
 *    URL shape: {IMGPROXY_PUBLIC_URL}/rs:fit:{w}:{h}:0/q:85/{base64url-source}.webp
 *
 * 3. Local disk, no imgproxy (development):
 *    Falls back to /api/photos/[id]/source directly.
 */
export function buildStudioImageUrl(photoId: string): string {
  return `/api/photos/${encodeURIComponent(photoId)}/source`;
}

export function buildPublicImageUrl(photoId: string, options: ImageOptions = {}): string {
  const env = getFrontendEnv();
  const relativeSource = buildStudioImageUrl(photoId);

  // If imgproxy is configured (non-default URL), wrap the source in an
  // imgproxy processing path for resizing. On R2 the redirect happens
  // transparently — imgproxy follows the 302 and fetches from R2.
  const imgproxyBase = env.IMGPROXY_PUBLIC_URL.replace(/\/$/, "");
  const isImgproxyConfigured =
    imgproxyBase !== "http://localhost:8080" && imgproxyBase !== "";

  if (isImgproxyConfigured) {
    const apiBase = (env.NEXT_PUBLIC_API_URL ?? env.NEXT_PUBLIC_SITE_URL).replace(/\/$/, "");
    const sourcePath = `${apiBase}${relativeSource}`;
    const width = Math.min(Math.max(options.width ?? 2200, 1), 5000);
    const height = Math.min(Math.max(options.height ?? 0, 0), 5000);
    const format = options.format ?? "webp";
    const encodedSource = Buffer.from(sourcePath).toString("base64url");
    const processingPath = `/rs:fit:${width}:${height}:0/q:85/${encodedSource}.${format}`;
    return `${imgproxyBase}${processingPath}`;
  }

  // Same-origin on the Render monolith so Docker builds that default
  // NEXT_PUBLIC_SITE_URL to localhost still serve photos in the browser.
  // Vercel sets NEXT_PUBLIC_API_URL to the Render origin.
  if (env.NEXT_PUBLIC_API_URL) {
    return `${env.NEXT_PUBLIC_API_URL.replace(/\/$/, "")}${relativeSource}`;
  }
  return relativeSource;
}
