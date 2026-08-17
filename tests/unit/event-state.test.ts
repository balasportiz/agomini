import { describe, expect, it } from "vitest";
import { getCountdown, getEventPhase } from "@/lib/event-state";

const event = "2026-10-04T00:30:00.000Z";

describe("getEventPhase", () => {
  it("reports upcoming before flag-off", () => {
    expect(getEventPhase(event, new Date("2026-10-03T00:30:00.000Z"))).toBe("upcoming");
  });

  it("reports underway during the configured race window", () => {
    expect(getEventPhase(event, new Date("2026-10-04T02:00:00.000Z"))).toBe("underway");
  });

  it("reports completed after the race window", () => {
    expect(getEventPhase(event, new Date("2026-10-04T07:00:00.000Z"))).toBe("completed");
  });
});

describe("getCountdown", () => {
  it("returns stable non-negative countdown units", () => {
    expect(getCountdown(event, new Date("2026-10-03T00:30:00.000Z"))).toEqual({
      days: 1,
      hours: 0,
      minutes: 0,
      seconds: 0,
    });
  });
});
