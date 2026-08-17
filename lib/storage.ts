import os from "node:os";
import { randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, readFile, statfs } from "node:fs/promises";
import path from "node:path";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export const ALLOWED_IMAGE_MIME_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"] as const;
export type AllowedImageMimeType = (typeof ALLOWED_IMAGE_MIME_TYPES)[number];

const allowedExtensions = new Set([".jpg", ".jpeg", ".png", ".webp"]);

export type StorageLayout = {
  root: string;
  temp: string;
};

export type UploadCandidate = {
  data?: Buffer;
  mimetype: string;
  name: string;
  size: number;
  tempFilePath?: string;
};

export async function readUploadBuffer(file: UploadCandidate): Promise<Buffer> {
  if (file.data && file.data.length > 0) return file.data;
  if (file.tempFilePath) return readFile(file.tempFilePath);
  throw new Error("Upload file bytes are missing");
}

// ---------------------------------------------------------------------------
// R2 / S3 client (lazy singleton — only constructed when S3_BUCKET is set)
// ---------------------------------------------------------------------------

export type R2Config = {
  endpoint: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  publicUrl: string;
};

let cachedR2Client: S3Client | undefined;
let cachedR2Config: R2Config | undefined;

/**
 * Accepts the Cloudflare S3 API host in any of the shapes the dashboard shows:
 *   https://<ACCOUNT_ID>.r2.cloudflarestorage.com
 *   https://r2.cloudflarestorage.com  (+ S3_ACCOUNT_ID)
 *   r2.cloudflarestorage.com
 */
export function normalizeR2Endpoint(raw: string, accountId?: string): string {
  let value = raw.trim();
  if (!value) throw new Error("S3_ENDPOINT is empty");
  if (!/^https?:\/\//i.test(value)) value = `https://${value}`;
  const url = new URL(value);
  const host = url.hostname.toLowerCase();
  if (host === "r2.cloudflarestorage.com" || host === "www.r2.cloudflarestorage.com") {
    const id = accountId?.trim();
    if (!id) {
      throw new Error(
        "S3_ENDPOINT is r2.cloudflarestorage.com. Set S3_ACCOUNT_ID or use https://<ACCOUNT_ID>.r2.cloudflarestorage.com",
      );
    }
    url.hostname = `${id}.r2.cloudflarestorage.com`;
  }
  return url.origin;
}

export function getR2ConfigError(): string | null {
  const rawEndpoint = process.env.S3_ENDPOINT?.trim();
  const bucket = process.env.S3_BUCKET?.trim();
  const accessKeyId = process.env.S3_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY?.trim();
  const publicUrl = process.env.S3_PUBLIC_URL?.trim();
  const present = [rawEndpoint, bucket, accessKeyId, secretAccessKey, publicUrl].filter(Boolean).length;
  if (present === 0) return null;
  if (present < 5) {
    return "R2 is only partly configured. Set S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, and S3_PUBLIC_URL.";
  }
  try {
    normalizeR2Endpoint(rawEndpoint!, process.env.S3_ACCOUNT_ID);
  } catch (error) {
    return error instanceof Error ? error.message : "S3_ENDPOINT is invalid.";
  }
  return null;
}

export function getUploadTempDir(storageRoot: string): string {
  if (process.env.RENDER || isR2Active()) {
    return path.join(os.tmpdir(), "agomoni-uploads");
  }
  return getStorageLayout(storageRoot).temp;
}

/**
 * AWS SDK 3.729+ still attaches CRC32 checksums to PutObject even with
 * WHEN_REQUIRED, because S3 now treats PutObject as a checksum-required
 * operation. R2 rejects those headers. Strip them *before* SigV4 signing
 * so the canonical request matches what Cloudflare actually receives.
 */
function stripUnsupportedR2Checksums(client: S3Client): void {
  const middleware = (next: (args: unknown) => Promise<unknown>) => async (args: {
    request?: { headers?: Record<string, string> };
  }) => {
    const headers = args.request?.headers;
    if (headers) {
      for (const key of Object.keys(headers)) {
        if (/^x-amz-checksum/i.test(key) || /^x-amz-sdk-checksum/i.test(key)) {
          delete headers[key];
        }
      }
    }
    return next(args);
  };

  // End of `build` is after checksum middleware and before SigV4 in `finalizeRequest`.
  client.middlewareStack.add(middleware as never, {
    step: "build",
    name: "stripR2ChecksumsAfterBuild",
    priority: "low",
  });
}

/**
 * Returns R2 config and a lazy S3Client if all R2 env vars are set,
 * or null when local-disk mode should be used instead.
 */
export function getR2(): { client: S3Client; config: R2Config } | null {
  if (getR2ConfigError()) return null;
  const rawEndpoint = process.env.S3_ENDPOINT;
  const bucket = process.env.S3_BUCKET;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  const publicUrl = process.env.S3_PUBLIC_URL;

  if (!rawEndpoint || !bucket || !accessKeyId || !secretAccessKey || !publicUrl) return null;

  const endpoint = normalizeR2Endpoint(rawEndpoint, process.env.S3_ACCOUNT_ID);

  if (!cachedR2Client || !cachedR2Config || cachedR2Config.endpoint !== endpoint || cachedR2Config.bucket !== bucket) {
    cachedR2Config = { endpoint, bucket, accessKeyId, secretAccessKey, publicUrl };
    process.env.AWS_REQUEST_CHECKSUM_CALCULATION ??= "WHEN_REQUIRED";
    process.env.AWS_RESPONSE_CHECKSUM_VALIDATION ??= "WHEN_REQUIRED";
    cachedR2Client = new S3Client({
      region: "auto",
      endpoint,
      credentials: { accessKeyId, secretAccessKey },
      // Path-style: https://<ACCOUNT_ID>.r2.cloudflarestorage.com/<bucket>/<key>
      forcePathStyle: true,
      requestChecksumCalculation: "WHEN_REQUIRED",
      responseChecksumValidation: "WHEN_REQUIRED",
    });
    stripUnsupportedR2Checksums(cachedR2Client);
  }
  return { client: cachedR2Client, config: cachedR2Config };
}

/** True when R2 is configured and should be used as the primary store. */
export function isR2Active(): boolean {
  return getR2() !== null;
}

// ---------------------------------------------------------------------------
// Key helpers
// ---------------------------------------------------------------------------

/**
 * Builds the R2 object key for a stored filename.
 * All photos sit in the root of the bucket (no prefix needed — the bucket
 * is dedicated to this app). Keep the UUID filename as the key so the same
 * logic works for both R2 and local disk.
 */
export function r2KeyForFilename(filename: string): string {
  return filename;
}

/**
 * Returns the full public URL for an R2-stored file.
 * Used by image-url.ts when R2 is active.
 */
export function r2PublicUrl(filename: string): string {
  const r2 = getR2();
  if (!r2) throw new Error("R2 is not configured");
  const base = r2.config.publicUrl.replace(/\/$/, "");
  return `${base}/${encodeURIComponent(filename)}`;
}

// ---------------------------------------------------------------------------
// R2 operations
// ---------------------------------------------------------------------------

/** Uploads a buffer to R2. Returns the public URL. */
export async function r2PutObject(
  filename: string,
  data: Buffer,
  mimeType: string,
): Promise<string> {
  const r2 = getR2();
  if (!r2) throw new Error("R2 is not configured");
  try {
    await r2.client.send(
      new PutObjectCommand({
        Bucket: r2.config.bucket,
        Key: r2KeyForFilename(filename),
        Body: data,
        ContentType: mimeType === "image/jpg" ? "image/jpeg" : mimeType,
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );
  } catch (error) {
    const code = (error as { Code?: string; name?: string }).Code ?? (error as { name?: string }).name;
    const message = error instanceof Error ? error.message : "Unknown R2 error";
    throw new Error(`Could not store the photo in R2${code ? ` (${code})` : ""}: ${message}`);
  }
  return r2PublicUrl(filename);
}

/** Downloads a file from R2 as a Buffer. */
export async function r2GetObject(filename: string): Promise<Buffer> {
  const r2 = getR2();
  if (!r2) throw new Error("R2 is not configured");
  const response = await r2.client.send(
    new GetObjectCommand({
      Bucket: r2.config.bucket,
      Key: r2KeyForFilename(filename),
    }),
  );
  if (!response.Body) throw new Error(`R2 object not found: ${filename}`);
  // Body is a ReadableStream in Node.js — collect it
  const chunks: Uint8Array[] = [];
  for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

/** Deletes a file from R2. Silently ignores 404. */
export async function r2DeleteObject(filename: string): Promise<void> {
  const r2 = getR2();
  if (!r2) return;
  try {
    await r2.client.send(
      new DeleteObjectCommand({
        Bucket: r2.config.bucket,
        Key: r2KeyForFilename(filename),
      }),
    );
  } catch (error: unknown) {
    const code = (error as { Code?: string; name?: string })?.Code ?? (error as { name?: string })?.name;
    if (code === "NoSuchKey" || code === "NotFound") return;
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Local-disk helpers (unchanged, still used when R2 is not configured)
// ---------------------------------------------------------------------------

export function getStorageLayout(storageRoot: string): StorageLayout {
  const root = path.resolve(storageRoot);
  return { root, temp: path.resolve(root, ".tmp") };
}

const extensionByMime: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

export function createStoredFilename(
  originalName: string,
  createID: () => string = randomUUID,
  mimeType?: string,
): string {
  const base = path.basename(originalName).toLowerCase();
  const matched = [".jpeg", ".jpg", ".png", ".webp"].find((ext) => base.endsWith(ext));
  const fromMime = mimeType ? extensionByMime[mimeType.toLowerCase()] : undefined;
  const extension = matched === ".jpeg" ? ".jpg" : (matched ?? fromMime);
  if (!extension || !allowedExtensions.has(extension)) {
    throw new Error("Unsupported image extension");
  }
  return `${createID()}${extension}`;
}

export function resolveStoredFile(storageRoot: string, storageKey: string): string {
  const root = path.resolve(storageRoot);
  const resolved = path.resolve(root, storageKey);
  if (
    !storageKey ||
    path.isAbsolute(storageKey) ||
    !resolved.startsWith(`${root}${path.sep}`)
  ) {
    throw new Error("Resolved file is outside STORAGE_ROOT");
  }
  return resolved;
}

export function isAllowedImageSignature(bytes: Buffer, mimeType: string): boolean {
  const normalized = mimeType === "image/jpg" ? "image/jpeg" : mimeType;
  if (normalized === "image/jpeg")
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (normalized === "image/png")
    return bytes.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex"));
  if (normalized === "image/webp") {
    return (
      bytes.subarray(0, 4).toString("ascii") === "RIFF" &&
      bytes.subarray(8, 12).toString("ascii") === "WEBP"
    );
  }
  return false;
}

export async function validateUploadCandidate(
  file: UploadCandidate,
  maxBytes: number,
): Promise<void> {
  if (file.size <= 0 || file.size > maxBytes) {
    throw new Error(`Upload must be between 1 and ${maxBytes} bytes`);
  }
  if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.mimetype as AllowedImageMimeType)) {
    throw new Error("Only JPEG, PNG and WebP images are allowed");
  }
  if (file.mimetype === "image/jpg") file.mimetype = "image/jpeg";
  const bytes = file.data?.length
    ? file.data.subarray(0, 12)
    : file.tempFilePath
      ? (await readFile(file.tempFilePath)).subarray(0, 12)
      : undefined;
  if (!bytes || !isAllowedImageSignature(bytes, file.mimetype)) {
    throw new Error("Uploaded file content does not match its declared image type");
  }
}

export async function ensureStorageLayout(layout: StorageLayout): Promise<void> {
  await Promise.all([
    mkdir(layout.root, { recursive: true }),
    mkdir(layout.temp, { recursive: true }),
  ]);
}

export async function assertStorageCapacity(
  storageRoot: string,
  incomingBytes: number,
  reserveBytes = 0,
): Promise<number> {
  const stats = await statfs(storageRoot);
  const totalBytes = stats.blocks * stats.bsize;
  const availableBytes = stats.bavail * stats.bsize;
  if (totalBytes <= 0) throw new Error("Unable to determine storage capacity");
  const projectedRatio = (totalBytes - availableBytes + incomingBytes) / totalBytes;
  if (availableBytes - incomingBytes < reserveBytes || projectedRatio >= 0.9) {
    throw new Error("Upload rejected because storage reserve is below the safe threshold");
  }
  return projectedRatio;
}

// ---------------------------------------------------------------------------
// Unified store/retrieve — used by Media collection hooks and the photo route
// ---------------------------------------------------------------------------

/**
 * Stores a file either in R2 or on local disk depending on configuration.
 * Returns the storage key (filename) — same in both cases.
 */
export async function storeFile(
  filename: string,
  data: Buffer,
  mimeType: string,
  layout: StorageLayout,
): Promise<void> {
  if (isR2Active()) {
    await r2PutObject(filename, data, mimeType);
    return;
  }
  // Local disk — Payload's own upload handler already wrote the file via
  // staticDir; this function is a no-op in that path and only used when
  // we need to write manually (e.g. during Drive import where we pass
  // `file.data` directly).
  const { writeFile } = await import("node:fs/promises");
  await ensureStorageLayout(layout);
  const dest = resolveStoredFile(layout.root, filename);
  await writeFile(dest, data);
}

/**
 * Retrieves a file as a Buffer from R2 or local disk.
 */
export async function retrieveFile(
  filename: string,
  storageRoot: string,
): Promise<Buffer> {
  if (isR2Active()) {
    return r2GetObject(filename);
  }
  return readFile(resolveStoredFile(storageRoot, filename));
}

/**
 * Deletes a file from R2 or local disk. Used in afterDelete hook.
 */
export async function deleteFile(
  filename: string,
  storageRoot: string,
): Promise<void> {
  if (isR2Active()) {
    await r2DeleteObject(filename);
    return;
  }
  const { unlink } = await import("node:fs/promises");
  try {
    await unlink(resolveStoredFile(storageRoot, filename));
  } catch (error: unknown) {
    if ((error as { code?: string })?.code !== "ENOENT") throw error;
  }
}

/**
 * Streams a file as a ReadableStream for the HTTP source route.
 * On R2: fetches the object and streams it.
 * On local disk: uses createReadStream.
 */
export async function streamFile(
  filename: string,
  storageRoot: string,
): Promise<{ stream: ReadableStream; size: number; mimeType?: string }> {
  if (isR2Active()) {
    const r2 = getR2()!;
    const response = await r2.client.send(
      new GetObjectCommand({
        Bucket: r2.config.bucket,
        Key: r2KeyForFilename(filename),
      }),
    );
    if (!response.Body) throw new Error(`R2 object not found: ${filename}`);
    const size = response.ContentLength ?? 0;
    const mimeType = response.ContentType;
    // Convert Web ReadableStream (R2 SDK response) to a passthrough
    const body = response.Body as unknown as ReadableStream;
    return { stream: body, size, mimeType };
  }
  // Local disk
  const { stat } = await import("node:fs/promises");
  const { Readable } = await import("node:stream");
  const filePath = resolveStoredFile(storageRoot, filename);
  const fileStats = await stat(filePath);
  const nodeStream = createReadStream(filePath);
  const stream = Readable.toWeb(nodeStream) as ReadableStream;
  return { stream, size: fileStats.size };
}
