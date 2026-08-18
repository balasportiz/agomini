import { describe, expect, it } from "vitest"
import { payloadListQuery } from "@/lib/payload-query"

describe("payloadListQuery", () => {
  it("encodes nested Payload where keys", () => {
    expect(
      payloadListQuery({
        "where[assetType][equals]": "event-gallery",
        sort: "_order",
        limit: 1000,
      }),
    ).toBe("where%5BassetType%5D%5Bequals%5D=event-gallery&sort=_order&limit=1000")
  })
})
