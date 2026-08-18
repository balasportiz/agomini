import { describe, expect, it } from "vitest"
import { parseChangePasswordBody } from "@/lib/change-password"

describe("parseChangePasswordBody", () => {
  it("accepts currentPassword and newPassword", () => {
    expect(parseChangePasswordBody({ currentPassword: "old-pass-1", newPassword: "new-pass-1" })).toEqual({
      currentPassword: "old-pass-1",
      newPassword: "new-pass-1",
    })
  })

  it("accepts oldPassword as an alias", () => {
    expect(parseChangePasswordBody({ oldPassword: "old-pass-1", newPassword: "new-pass-1" })).toEqual({
      currentPassword: "old-pass-1",
      newPassword: "new-pass-1",
    })
  })

  it("rejects a short new password", () => {
    expect(parseChangePasswordBody({ currentPassword: "old-pass-1", newPassword: "short" })).toEqual({
      error: "New password must be at least 8 characters.",
    })
  })
})
