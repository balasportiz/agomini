import { describe, expect, it } from "vitest"
import { getPublicApiBase, getServerApiBase } from "@/lib/api-base"

describe("getServerApiBase", () => {
  it("uses NEXT_PUBLIC_API_URL for server-side Payload REST calls", () => {
    const previous = process.env.NEXT_PUBLIC_API_URL
    try {
      process.env.NEXT_PUBLIC_API_URL = "https://agomoni-backend.onrender.com"
      expect(getServerApiBase()).toBe("https://agomoni-backend.onrender.com")
    } finally {
      if (previous === undefined) delete process.env.NEXT_PUBLIC_API_URL
      else process.env.NEXT_PUBLIC_API_URL = previous
    }
  })
})

describe("getPublicApiBase", () => {
  it("prefers the backend origin for browser-facing media URLs", () => {
    const previousApi = process.env.NEXT_PUBLIC_API_URL
    const previousSite = process.env.NEXT_PUBLIC_SITE_URL
    try {
      process.env.NEXT_PUBLIC_API_URL = "https://agomoni-backend.onrender.com/"
      process.env.NEXT_PUBLIC_SITE_URL = "https://agomonirun.com"
      expect(getPublicApiBase()).toBe("https://agomoni-backend.onrender.com")
    } finally {
      if (previousApi === undefined) delete process.env.NEXT_PUBLIC_API_URL
      else process.env.NEXT_PUBLIC_API_URL = previousApi
      if (previousSite === undefined) delete process.env.NEXT_PUBLIC_SITE_URL
      else process.env.NEXT_PUBLIC_SITE_URL = previousSite
    }
  })
})
