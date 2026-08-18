import { describe, expect, it } from "vitest"
import { payloadCorsOrigins } from "@/lib/cors"

describe("payloadCorsOrigins", () => {
  it("allows the public site, Render API, and www variants", () => {
    expect(payloadCorsOrigins("https://agomonirun.com", "https://agomoni-backend.onrender.com")).toEqual([
      "https://agomonirun.com",
      "https://agomoni-backend.onrender.com",
      "https://www.agomonirun.com",
      "https://www.agomoni-backend.onrender.com",
    ])
  })
})
