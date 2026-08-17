import { describe, expect, it } from "vitest"
import { payloadCorsOrigins, rewriteSetCookieForProxy, shouldProxyPayloadApi } from "@/lib/payload-proxy"

describe("shouldProxyPayloadApi", () => {
  it("is off unless both Vercel and the Render API URL are set", () => {
    const previousVercel = process.env.VERCEL
    const previousApi = process.env.NEXT_PUBLIC_API_URL
    try {
      delete process.env.VERCEL
      process.env.NEXT_PUBLIC_API_URL = "https://agomoni-backend.onrender.com"
      expect(shouldProxyPayloadApi()).toBe(false)

      process.env.VERCEL = "1"
      expect(shouldProxyPayloadApi()).toBe(true)

      delete process.env.NEXT_PUBLIC_API_URL
      expect(shouldProxyPayloadApi()).toBe(false)
    } finally {
      if (previousVercel === undefined) delete process.env.VERCEL
      else process.env.VERCEL = previousVercel
      if (previousApi === undefined) delete process.env.NEXT_PUBLIC_API_URL
      else process.env.NEXT_PUBLIC_API_URL = previousApi
    }
  })
})

describe("rewriteSetCookieForProxy", () => {
  it("drops Domain so the cookie is stored on the Vercel host", () => {
    expect(
      rewriteSetCookieForProxy("payload-token=abc; Path=/; Domain=agomoni-backend.onrender.com; HttpOnly; Secure; SameSite=Lax"),
    ).toBe("payload-token=abc; Path=/; HttpOnly; Secure; SameSite=Lax")
  })
})

describe("payloadCorsOrigins", () => {
  it("allows the public site, Render API, and extra origins", () => {
    expect(payloadCorsOrigins("https://agomonirun.com", "https://agomoni-backend.onrender.com", "https://agomoni-backend.onrender.com")).toEqual([
      "https://agomonirun.com",
      "https://agomoni-backend.onrender.com",
    ])
  })
})
