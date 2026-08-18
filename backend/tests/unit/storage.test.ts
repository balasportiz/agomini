import os from "node:os"
import path from "node:path"
import { describe, expect, it } from "vitest"
import {
  createStoredFilename,
  getR2ConfigError,
  getStorageLayout,
  getUploadTempDir,
  isAllowedImageSignature,
  normalizeR2Endpoint,
  resolveStoredFile,
} from "@/lib/storage"

describe("normalizeR2Endpoint", () => {
  it("keeps the account-id S3 API host", () => {
    expect(normalizeR2Endpoint("https://abc123.r2.cloudflarestorage.com/")).toBe(
      "https://abc123.r2.cloudflarestorage.com",
    )
  })

  it("expands the bare r2.cloudflarestorage.com host with S3_ACCOUNT_ID", () => {
    expect(normalizeR2Endpoint("r2.cloudflarestorage.com", "abc123")).toBe(
      "https://abc123.r2.cloudflarestorage.com",
    )
  })

  it("rejects the bare host when the account id is missing", () => {
    expect(() => normalizeR2Endpoint("https://r2.cloudflarestorage.com")).toThrow(/S3_ACCOUNT_ID/)
  })
})

describe("storage helpers", () => {
  it("keeps temporary uploads inside the mounted photo directory", () => {
    const layout = getStorageLayout("/mnt/data/photos")

    expect(layout.root).toBe(path.resolve("/mnt/data/photos"))
    expect(layout.temp).toBe(path.resolve("/mnt/data/photos/.tmp"))
  })

  it("creates collision-resistant names while preserving allowed extensions", () => {
    expect(createStoredFilename("Race Day.WEBP", () => "fixed-id")).toBe("fixed-id.webp")
    expect(createStoredFilename("Golaghat Suburban Run 2026 Thumbnail.jpg.jpeg", () => "fixed-id")).toBe("fixed-id.jpg")
    expect(createStoredFilename("thumb.jpg.jpe", () => "fixed-id", "image/jpeg")).toBe("fixed-id.jpg")
    expect(() => createStoredFilename("payload.svg", () => "fixed-id")).toThrow(/Unsupported image extension/)
  })

  it("rejects paths that escape the configured storage root", () => {
    expect(resolveStoredFile("/mnt/data/photos", "2026/race.jpg")).toBe(path.resolve("/mnt/data/photos/2026/race.jpg"))
    expect(() => resolveStoredFile("/mnt/data/photos", "../secret.env")).toThrow(/outside STORAGE_ROOT/)
  })

  it("matches JPEG, PNG and WebP signatures to their declared MIME type", () => {
    expect(isAllowedImageSignature(Buffer.from([0xff, 0xd8, 0xff]), "image/jpeg")).toBe(true)
    expect(isAllowedImageSignature(Buffer.from("89504e470d0a1a0a", "hex"), "image/png")).toBe(true)
    expect(isAllowedImageSignature(Buffer.from("524946460000000057454250", "hex"), "image/webp")).toBe(true)
    expect(isAllowedImageSignature(Buffer.from("<script>"), "image/png")).toBe(false)
  })
})

describe("getUploadTempDir", () => {
  it("uses the OS temp directory on Render instead of STORAGE_ROOT", () => {
    const previous = process.env.RENDER
    process.env.RENDER = "true"
    try {
      expect(getUploadTempDir("/mnt/data/photos")).toBe(path.join(os.tmpdir(), "agomoni-uploads"))
    } finally {
      if (previous === undefined) delete process.env.RENDER
      else process.env.RENDER = previous
    }
  })
})

describe("getR2ConfigError", () => {
  const keys = [
    "S3_ENDPOINT",
    "S3_BUCKET",
    "S3_ACCESS_KEY_ID",
    "S3_SECRET_ACCESS_KEY",
    "S3_PUBLIC_URL",
    "S3_ACCOUNT_ID",
  ] as const

  function withS3Env(values: Partial<Record<(typeof keys)[number], string | undefined>>, run: () => void) {
    const previous = Object.fromEntries(keys.map((key) => [key, process.env[key]]))
    try {
      for (const key of keys) delete process.env[key]
      for (const [key, value] of Object.entries(values)) {
        if (value === undefined) delete process.env[key]
        else process.env[key] = value
      }
      run()
    } finally {
      for (const key of keys) {
        if (previous[key] === undefined) delete process.env[key]
        else process.env[key] = previous[key]
      }
    }
  }

  it("is silent when R2 is not configured at all", () => {
    withS3Env({}, () => {
      expect(getR2ConfigError()).toBeNull()
    })
  })

  it("reports incomplete R2 settings instead of falling back to local disk", () => {
    withS3Env({ S3_ENDPOINT: "https://abc123.r2.cloudflarestorage.com", S3_BUCKET: "agomonirun" }, () => {
      expect(getR2ConfigError()).toMatch(/partly configured/)
    })
  })
})
