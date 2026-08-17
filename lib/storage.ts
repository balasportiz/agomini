import { randomUUID } from "node:crypto"
import { mkdir, readFile, statfs } from "node:fs/promises"
import path from "node:path"

export const ALLOWED_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const
export type AllowedImageMimeType = (typeof ALLOWED_IMAGE_MIME_TYPES)[number]

const allowedExtensions = new Set([".jpg", ".jpeg", ".png", ".webp"])

export type StorageLayout = {
  root: string
  temp: string
}

export type UploadCandidate = {
  data?: Buffer
  mimetype: string
  name: string
  size: number
  tempFilePath?: string
}

export function getStorageLayout(storageRoot: string): StorageLayout {
  const root = path.resolve(storageRoot)
  return { root, temp: path.resolve(root, ".tmp") }
}

export function createStoredFilename(originalName: string, createID: () => string = randomUUID): string {
  const extension = path.extname(path.basename(originalName)).toLowerCase()
  if (!allowedExtensions.has(extension)) throw new Error("Unsupported image extension")
  return `${createID()}${extension}`
}

export function resolveStoredFile(storageRoot: string, storageKey: string): string {
  const root = path.resolve(storageRoot)
  const resolved = path.resolve(root, storageKey)
  if (!storageKey || path.isAbsolute(storageKey) || !resolved.startsWith(`${root}${path.sep}`)) {
    throw new Error("Resolved file is outside STORAGE_ROOT")
  }
  return resolved
}

export function isAllowedImageSignature(bytes: Buffer, mimeType: string): boolean {
  if (mimeType === "image/jpeg") return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
  if (mimeType === "image/png") return bytes.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex"))
  if (mimeType === "image/webp") {
    return bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP"
  }
  return false
}

export async function validateUploadCandidate(file: UploadCandidate, maxBytes: number): Promise<void> {
  if (file.size <= 0 || file.size > maxBytes) {
    throw new Error(`Upload must be between 1 and ${maxBytes} bytes`)
  }
  if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.mimetype as AllowedImageMimeType)) {
    throw new Error("Only JPEG, PNG and WebP images are allowed")
  }

  const bytes = file.data?.length ? file.data.subarray(0, 12) : file.tempFilePath ? (await readFile(file.tempFilePath)).subarray(0, 12) : undefined
  if (!bytes || !isAllowedImageSignature(bytes, file.mimetype)) {
    throw new Error("Uploaded file content does not match its declared image type")
  }
}

export async function ensureStorageLayout(layout: StorageLayout): Promise<void> {
  await Promise.all([mkdir(layout.root, { recursive: true }), mkdir(layout.temp, { recursive: true })])
}

export async function assertStorageCapacity(storageRoot: string, incomingBytes: number, reserveBytes = 0): Promise<number> {
  const stats = await statfs(storageRoot)
  const totalBytes = stats.blocks * stats.bsize
  const availableBytes = stats.bavail * stats.bsize
  if (totalBytes <= 0) throw new Error("Unable to determine storage capacity")

  const projectedRatio = (totalBytes - availableBytes + incomingBytes) / totalBytes
  if (availableBytes - incomingBytes < reserveBytes || projectedRatio >= 0.9) {
    throw new Error("Upload rejected because storage reserve is below the safe threshold")
  }
  return projectedRatio
}
