import { describe, expect, it } from "vitest";
import { safeExternalDestination } from "@/lib/redirects";

const site = "https://agomonirun.example";

describe("safeExternalDestination", () => {
  it("accepts HTTP and HTTPS destinations", () => {
    expect(safeExternalDestination("https://register.example/race", site, "/register")).toBe(
      "https://register.example/race",
    );
  });

  it.each(["javascript:alert(1)", "data:text/html,bad", "not a url"])(
    "rejects unsafe destination %s",
    (value) => expect(safeExternalDestination(value, site, "/register")).toBeNull(),
  );

  it("rejects a redirect loop back to the internal route", () => {
    expect(safeExternalDestination(`${site}/register`, site, "/register")).toBeNull();
  });
});
