import { describe, expect, it } from "vitest"
import { parseFrontendEnv } from "@/lib/env"

describe("parseFrontendEnv", () => {
  it("requires NEXT_PUBLIC_API_URL", () => {
    const env = parseFrontendEnv({
      NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
      NEXT_PUBLIC_API_URL: "http://localhost:3001",
    })
    expect(env.NEXT_PUBLIC_API_URL).toBe("http://localhost:3001")
  })
})
