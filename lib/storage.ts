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

export const ALLOWED_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
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
 * Returns R2 config and a lazy S3Client if all four R2 env vars are set,
 * or null when local-disk mode should be used instead.
 */
export function getR2(): { client: S3Client; config: R2Config } | null {
  const endpoint = process.env.S3_ENDPOINT;
  const bucket = process.env.S3_BUCKET;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  const publicUrl = process.env.S3_PUBLIC_URL;

  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey || !publicUrl) return null;

  if (!cachedR2Client || !cachedR2Config) {
    cachedR2Config = { endpoint, bucket, accessKeyId, secretAccessKey, publicUrl };
    cachedR2Client = new S3Client({
      region: "auto",
      endpoint,
      credentials: { accessKeyId, secretAccessKey },
      // R2 requires path-style URLs
      forcePathStyle: false,
    });
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
  await r2.client.send(
    new PutObjectCommand({
      Bucket: r2.config.bucket,
      Key: r2KeyForFilename(filename),
      Body: data,
      ContentType: mimeType,
      // Cache for 1 year — immutable because filenames are UUIDs
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
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

export function createStoredFilename(
  originalName: string,
  createID: () => string = randomUUID,
): string {
  const extension = path.extname(path.basename(originalName)).toLowerCase();
  if (!allowedExtensions.has(extension)) throw new Error("Unsupported image extension");
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
  if (mimeType === "image/jpeg")
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (mimeType === "image/png")
    return bytes.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex"));
  if (mimeType === "image/webp") {
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
