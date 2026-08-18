import { describe, expect, it } from "vitest"
import { proxyPayloadRequest, rewriteSetCookieForProxy, shouldProxyPayloadApi } from "@/lib/payload-proxy"

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

describe("proxyPayloadRequest", () => {
  it("forwards set-cookie even when getSetCookie is unavailable", async () => {
    const previousApi = process.env.NEXT_PUBLIC_API_URL
    const previousFetch = global.fetch
    try {
      process.env.NEXT_PUBLIC_API_URL = "https://agomini.onrender.com"
      global.fetch = async () =>
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: {
            "content-type": "application/json",
            "set-cookie": "payload-token=abc; Path=/; Domain=agomini.onrender.com; HttpOnly; Secure; SameSite=Lax",
          },
        })

      const response = await proxyPayloadRequest(new Request("https://agomini.vercel.app/api/users/login", { method: "POST", body: "{}" }))

      expect(response.headers.get("set-cookie")).toBe("payload-token=abc; Path=/; HttpOnly; Secure; SameSite=Lax")
    } finally {
      global.fetch = previousFetch
      if (previousApi === undefined) delete process.env.NEXT_PUBLIC_API_URL
      else process.env.NEXT_PUBLIC_API_URL = previousApi
    }
  })

  it("does not forward browser origin headers to the backend", async () => {
    const previousApi = process.env.NEXT_PUBLIC_API_URL
    const previousFetch = global.fetch
    try {
      process.env.NEXT_PUBLIC_API_URL = "https://agomini.onrender.com"
      let forwardedHeaders: Headers | undefined
      global.fetch = (async (_input, init) => {
        forwardedHeaders = init?.headers as Headers
        return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "content-type": "application/json" } })
      }) as typeof global.fetch

      await proxyPayloadRequest(
        new Request("https://agomini.vercel.app/api/users/login", {
          method: "POST",
          headers: {
            origin: "https://agomini.vercel.app",
            referer: "https://agomini.vercel.app/studio/login",
            "content-type": "application/json",
          },
          body: "{}",
        }),
      )

      expect(forwardedHeaders?.get("origin")).toBeNull()
      expect(forwardedHeaders?.get("referer")).toBeNull()
      expect(forwardedHeaders?.get("content-type")).toBe("application/json")
    } finally {
      global.fetch = previousFetch
      if (previousApi === undefined) delete process.env.NEXT_PUBLIC_API_URL
      else process.env.NEXT_PUBLIC_API_URL = previousApi
    }
  })

  it("adds Authorization JWT from the session cookie for backend writes", async () => {
    const previousApi = process.env.NEXT_PUBLIC_API_URL
    const previousFetch = global.fetch
    try {
      process.env.NEXT_PUBLIC_API_URL = "https://agomoni.onrender.com"
      let forwardedHeaders: Headers | undefined
      global.fetch = (async (_input, init) => {
        forwardedHeaders = init?.headers as Headers
        return new Response(JSON.stringify({ doc: { id: "1" } }), { status: 201, headers: { "content-type": "application/json" } })
      }) as typeof global.fetch

      await proxyPayloadRequest(
        new Request("https://agomini.vercel.app/api/users", {
          method: "POST",
          headers: {
            cookie: "payload-token=session-token",
            "content-type": "application/json",
          },
          body: "{}",
        }),
      )

      expect(forwardedHeaders?.get("authorization")).toBe("JWT session-token")
    } finally {
      global.fetch = previousFetch
      if (previousApi === undefined) delete process.env.NEXT_PUBLIC_API_URL
      else process.env.NEXT_PUBLIC_API_URL = previousApi
    }
  })

  it("sets a host cookie from the login token when upstream omits set-cookie", async () => {
    const previousApi = process.env.NEXT_PUBLIC_API_URL
    const previousFetch = global.fetch
    try {
      process.env.NEXT_PUBLIC_API_URL = "https://agomoni.onrender.com"
      global.fetch = async () =>
        new Response(JSON.stringify({ token: "login-token", user: { id: "1" } }), {
          status: 200,
          headers: { "content-type": "application/json" },
        })

      const response = await proxyPayloadRequest(
        new Request("https://agomini.vercel.app/api/users/login", { method: "POST", body: "{}" }),
      )

      expect(response.headers.get("set-cookie")).toContain("payload-token=login-token")
      expect(response.headers.get("set-cookie")).toContain("Path=/")
      expect(response.headers.get("set-cookie")).toContain("HttpOnly")
      expect(response.headers.get("set-cookie")).toContain("SameSite=Lax")
    } finally {
      global.fetch = previousFetch
      if (previousApi === undefined) delete process.env.NEXT_PUBLIC_API_URL
      else process.env.NEXT_PUBLIC_API_URL = previousApi
    }
  })
})
