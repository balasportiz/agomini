import { describe, expect, it } from "vitest"
import { getPublicApiBase, getServerApiBase } from "@/lib/api-base"

describe("getServerApiBase", () => {
  it("uses loopback on Render so Studio auth does not hairpin the public domain", () => {
    const previous = {
      VERCEL: process.env.VERCEL,
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
      PORT: process.env.PORT,
    }
    try {
      delete process.env.VERCEL
      delete process.env.NEXT_PUBLIC_API_URL
      process.env.PORT = "10000"
      expect(getServerApiBase()).toBe("http://127.0.0.1:10000")
    } finally {
      restore(previous)
    }
  })

  it("uses NEXT_PUBLIC_API_URL on Vercel", () => {
    const previous = {
      VERCEL: process.env.VERCEL,
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
      PORT: process.env.PORT,
    }
    try {
      process.env.VERCEL = "1"
      process.env.NEXT_PUBLIC_API_URL = "https://agomoni-backend.onrender.com"
      expect(getServerApiBase()).toBe("https://agomoni-backend.onrender.com")
    } finally {
      restore(previous)
    }
  })
})

describe("getPublicApiBase", () => {
  it("prefers the public API origin for browser-facing URLs", () => {
    const previous = process.env.NEXT_PUBLIC_API_URL
    const previousSite = process.env.NEXT_PUBLIC_SITE_URL
    try {
      process.env.NEXT_PUBLIC_API_URL = "https://agomoni-backend.onrender.com/"
      expect(getPublicApiBase()).toBe("https://agomoni-backend.onrender.com")
    } finally {
      if (previous === undefined) delete process.env.NEXT_PUBLIC_API_URL
      else process.env.NEXT_PUBLIC_API_URL = previous
      if (previousSite === undefined) delete process.env.NEXT_PUBLIC_SITE_URL
      else process.env.NEXT_PUBLIC_SITE_URL = previousSite
    }
  })
})

function restore(previous: { VERCEL?: string; NEXT_PUBLIC_API_URL?: string; PORT?: string }) {
  if (previous.VERCEL === undefined) delete process.env.VERCEL
  else process.env.VERCEL = previous.VERCEL
  if (previous.NEXT_PUBLIC_API_URL === undefined) delete process.env.NEXT_PUBLIC_API_URL
  else process.env.NEXT_PUBLIC_API_URL = previous.NEXT_PUBLIC_API_URL
  if (previous.PORT === undefined) delete process.env.PORT
  else process.env.PORT = previous.PORT
}
