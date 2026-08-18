export type EventPhase = "upcoming" | "underway" | "completed";

const DEFAULT_RACE_WINDOW_MS = 6 * 60 * 60 * 1000;

export function getEventPhase(
  eventDateTime: string | Date,
  now = new Date(),
  raceWindowMs = DEFAULT_RACE_WINDOW_MS,
): EventPhase {
  const start = new Date(eventDateTime).getTime();
  if (!Number.isFinite(start)) return "upcoming";
  const current = now.getTime();
  if (current < start) return "upcoming";
  if (current < start + raceWindowMs) return "underway";
  return "completed";
}

export function getCountdown(eventDateTime: string | Date, now = new Date()) {
  const difference = Math.max(0, new Date(eventDateTime).getTime() - now.getTime());
  return {
    days: Math.floor(difference / 86_400_000),
    hours: Math.floor((difference / 3_600_000) % 24),
    minutes: Math.floor((difference / 60_000) % 60),
    seconds: Math.floor((difference / 1_000) % 60),
  };
}
