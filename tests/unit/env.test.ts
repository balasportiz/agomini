import { describe, expect, it } from "vitest"
import { parseServerEnv } from "@/lib/env"

const validEnv = {
  DATABASE_URL: "postgresql://user:pass@localhost:5432/agomoni",
  PAYLOAD_SECRET: "a-secure-secret-that-is-at-least-32-chars",
  NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
  STORAGE_ROOT: "./storage/photos",
  UPLOAD_MAX_BYTES: "15728640",
  IMGPROXY_BASE_URL: "http://imgproxy:8080",
  IMGPROXY_PUBLIC_URL: "http://localhost:8080",
}

describe("parseServerEnv", () => {
  it("coerces numeric settings and applies optional signing defaults", () => {
    const env = parseServerEnv(validEnv)

    expect(env.UPLOAD_MAX_BYTES).toBe(15_728_640)
    expect(env.IMGPROXY_KEY).toBe("")
    expect(env.IMGPROXY_SALT).toBe("")
  })

  it("returns a clear list of invalid server settings", () => {
    expect(() => parseServerEnv({ ...validEnv, DATABASE_URL: "", PAYLOAD_SECRET: "short" })).toThrow(
      /DATABASE_URL: DATABASE_URL is required.*PAYLOAD_SECRET: PAYLOAD_SECRET must be at least 32 characters/,
    )
  })

  it("rejects public site URLs with credentials or paths", () => {
    expect(() => parseServerEnv({ ...validEnv, NEXT_PUBLIC_SITE_URL: "https://user@example.com/admin" })).toThrow(
      /NEXT_PUBLIC_SITE_URL/,
    )
  })

  it("requires imgproxy signing material in production", () => {
    expect(() => parseServerEnv({ ...validEnv, NODE_ENV: "production" })).toThrow(/IMGPROXY_KEY.*IMGPROXY_SALT/)
  })
})
