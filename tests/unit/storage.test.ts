import path from "node:path"
import { describe, expect, it } from "vitest"
import {
  createStoredFilename,
  getStorageLayout,
  isAllowedImageSignature,
  resolveStoredFile,
} from "@/lib/storage"

describe("storage helpers", () => {
  it("keeps temporary uploads inside the mounted photo directory", () => {
    const layout = getStorageLayout("/mnt/data/photos")

    expect(layout.root).toBe(path.resolve("/mnt/data/photos"))
    expect(layout.temp).toBe(path.resolve("/mnt/data/photos/.tmp"))
  })

  it("creates collision-resistant names while preserving allowed extensions", () => {
    expect(createStoredFilename("Race Day.WEBP", () => "fixed-id")).toBe("fixed-id.webp")
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
