import { describe, expect, it } from "vitest"
import { buildPublicImageUrl, buildStudioImageUrl } from "@/lib/image-url"

describe("image URLs", () => {
  it("keeps Studio and public photos on the same origin", () => {
    expect(buildStudioImageUrl("photo-1")).toBe("/api/photos/photo-1/source")
    expect(buildPublicImageUrl("photo-1")).toBe("/api/photos/photo-1/source")
  })
})
