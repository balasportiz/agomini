import { describe, expect, it } from "vitest";
import { hasMinimumRole, isEditorOrAbove, isMediaManagerOrAbove, isSuperAdmin } from "@/lib/roles";

describe("hasMinimumRole", () => {
  it("returns false for a signed-out user", () => {
    expect(hasMinimumRole(null, "media-manager")).toBe(false);
    expect(hasMinimumRole(undefined, "media-manager")).toBe(false);
  });

  it("returns false for a user with an unrecognised role value", () => {
    expect(hasMinimumRole({ role: "unknown" }, "media-manager")).toBe(false);
  });

  it("ranks media-manager below editor below admin", () => {
    const mediaManager = { role: "media-manager" };
    const editor = { role: "editor" };
    const admin = { role: "admin" };

    expect(hasMinimumRole(mediaManager, "media-manager")).toBe(true);
    expect(hasMinimumRole(mediaManager, "editor")).toBe(false);
    expect(hasMinimumRole(mediaManager, "admin")).toBe(false);

    expect(hasMinimumRole(editor, "media-manager")).toBe(true);
    expect(hasMinimumRole(editor, "editor")).toBe(true);
    expect(hasMinimumRole(editor, "admin")).toBe(false);

    expect(hasMinimumRole(admin, "media-manager")).toBe(true);
    expect(hasMinimumRole(admin, "editor")).toBe(true);
    expect(hasMinimumRole(admin, "admin")).toBe(true);
  });
});

describe("role predicate helpers", () => {
  it("isSuperAdmin only matches the admin role", () => {
    expect(isSuperAdmin({ role: "admin" })).toBe(true);
    expect(isSuperAdmin({ role: "editor" })).toBe(false);
    expect(isSuperAdmin(null)).toBe(false);
  });

  it("isEditorOrAbove matches editor and admin, not media-manager", () => {
    expect(isEditorOrAbove({ role: "editor" })).toBe(true);
    expect(isEditorOrAbove({ role: "admin" })).toBe(true);
    expect(isEditorOrAbove({ role: "media-manager" })).toBe(false);
  });

  it("isMediaManagerOrAbove matches every known role", () => {
    expect(isMediaManagerOrAbove({ role: "media-manager" })).toBe(true);
    expect(isMediaManagerOrAbove({ role: "editor" })).toBe(true);
    expect(isMediaManagerOrAbove({ role: "admin" })).toBe(true);
    expect(isMediaManagerOrAbove(null)).toBe(false);
  });
});
