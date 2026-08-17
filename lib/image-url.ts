import { createHmac } from "node:crypto";
import { getServerEnv } from "@/lib/env";

type ImageOptions = {
  width?: number;
  height?: number;
  format?: "avif" | "webp" | "jpg";
};

export function buildPublicImageUrl(photoId: string, options: ImageOptions = {}): string {
  const env = getServerEnv();
  const sourcePath = `/api/photos/${encodeURIComponent(photoId)}/source`;
  if (!env.IMGPROXY_KEY || !env.IMGPROXY_SALT) return sourcePath;

  const width = Math.min(Math.max(options.width ?? 2200, 1), 5000);
  const height = Math.min(Math.max(options.height ?? 0, 0), 5000);
  const format = options.format ?? "webp";
  const sourceUrl = new URL(sourcePath, env.APP_INTERNAL_URL).toString();
  const encodedSource = Buffer.from(sourceUrl).toString("base64url");
  const processingPath = `/rs:fit:${width}:${height}:0/q:85/${encodedSource}.${format}`;
  const signature = createHmac("sha256", Buffer.from(env.IMGPROXY_KEY, "hex"))
    .update(Buffer.from(env.IMGPROXY_SALT, "hex"))
    .update(processingPath)
    .digest("base64url");

  return new URL(`/${signature}${processingPath}`, env.IMGPROXY_PUBLIC_URL).toString();
}
