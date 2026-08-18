import { describe, expect, it } from "vitest"
import { rewriteSetCookieForProxy, shouldProxyPayloadApi } from "@/lib/payload-proxy"

describe("shouldProxyPayloadApi", () => {
  it("is on whenever the backend API URL is configured", () => {
    const previousApi = process.env.NEXT_PUBLIC_API_URL
    try {
      delete process.env.NEXT_PUBLIC_API_URL
      expect(shouldProxyPayloadApi()).toBe(false)
      process.env.NEXT_PUBLIC_API_URL = "https://agomoni-backend.onrender.com"
      expect(shouldProxyPayloadApi()).toBe(true)
    } finally {
      if (previousApi === undefined) delete process.env.NEXT_PUBLIC_API_URL
      else process.env.NEXT_PUBLIC_API_URL = previousApi
    }
  })
})

describe("rewriteSetCookieForProxy", () => {
  it("drops Domain so the cookie is stored on the frontend host", () => {
    expect(
      rewriteSetCookieForProxy("payload-token=abc; Path=/; Domain=agomoni-backend.onrender.com; HttpOnly; Secure; SameSite=Lax"),
    ).toBe("payload-token=abc; Path=/; HttpOnly; Secure; SameSite=Lax")
  })
})
