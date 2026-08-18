"use client";

import { useEffect, useState } from "react";
import { getCountdown, getEventPhase } from "@/lib/event-state";

type Props = {
  eventDateTime: string;
  initialNow: string;
  timingConfirmed: boolean;
};

export function Countdown({ eventDateTime, initialNow, timingConfirmed }: Props) {
  const [now, setNow] = useState(() => new Date(initialNow));

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1_000);
    return () => window.clearInterval(timer);
  }, []);

  const phase = getEventPhase(eventDateTime, now);
  const countdown = getCountdown(eventDateTime, now);

  if (phase === "underway") return <p className="event-live" aria-live="polite">The run is underway</p>;
  if (phase === "completed") return <p className="event-live" aria-live="polite">Race completed</p>;

  return (
    <div>
      <div className="countdown" aria-label="Countdown to Agomoni Run">
        {Object.entries(countdown).map(([label, value]) => (
          <div key={label} className="countdown-unit">
            <strong>{String(value).padStart(2, "0")}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
      {!timingConfirmed && <p className="timing-note">Flag-off time is an editable placeholder pending confirmation.</p>}
    </div>
  );
}
