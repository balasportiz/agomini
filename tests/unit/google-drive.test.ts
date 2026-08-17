import { describe, expect, it } from "vitest";
import { extractDriveId } from "@/lib/google-drive";

describe("extractDriveId", () => {
  it("extracts a file ID from a /file/d/ share link", () => {
    expect(extractDriveId("https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQrStUvWxYz/view?usp=sharing")).toBe(
      "1AbCdEfGhIjKlMnOpQrStUvWxYz",
    );
  });

  it("extracts a folder ID from a /drive/folders/ link", () => {
    expect(extractDriveId("https://drive.google.com/drive/folders/1FolderIdExample123?usp=sharing")).toBe(
      "1FolderIdExample123",
    );
  });

  it("extracts an ID from an ?id= query parameter", () => {
    expect(extractDriveId("https://drive.google.com/open?id=1QueryIdExample456")).toBe("1QueryIdExample456");
    expect(extractDriveId("https://drive.google.com/uc?id=1QueryIdExample789&export=download")).toBe(
      "1QueryIdExample789",
    );
  });

  it("accepts a bare Drive ID", () => {
    expect(extractDriveId("1BareDriveIdExample0123456789")).toBe("1BareDriveIdExample0123456789");
  });

  it("trims surrounding whitespace", () => {
    expect(extractDriveId("  1BareDriveIdExample0123456789  ")).toBe("1BareDriveIdExample0123456789");
  });

  it("returns null for empty input", () => {
    expect(extractDriveId("")).toBeNull();
    expect(extractDriveId("   ")).toBeNull();
  });

  it("returns null for a link with no recognisable ID", () => {
    expect(extractDriveId("https://example.com/not-a-drive-link")).toBeNull();
  });

  it("returns null for a short string that isn't a plausible ID", () => {
    expect(extractDriveId("short")).toBeNull();
  });
});
