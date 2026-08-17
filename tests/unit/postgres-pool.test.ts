import { describe, expect, it } from "vitest"
import { isSupabaseDirectConnection } from "@/lib/postgres-pool"

describe("isSupabaseDirectConnection", () => {
  it("detects the IPv6-only direct host on port 5432", () => {
    expect(
      isSupabaseDirectConnection("postgresql://postgres:pass@db.abcdefghijklmnop.supabase.co:5432/postgres?sslmode=require"),
    ).toBe(true)
  })

  it("allows the Session pooler used on Render", () => {
    expect(
      isSupabaseDirectConnection(
        "postgresql://postgres.abcd:pass@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require",
      ),
    ).toBe(false)
  })

  it("allows local and Docker hosts", () => {
    expect(isSupabaseDirectConnection("postgresql://agomoni:change-me@localhost:5432/agomoni_run")).toBe(false)
    expect(isSupabaseDirectConnection("postgresql://agomoni:change-me@postgres:5432/agomoni_run")).toBe(false)
  })
})
