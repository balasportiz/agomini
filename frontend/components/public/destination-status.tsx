import Link from "next/link";
import type { PublicSettings } from "@/lib/site-data";

export function DestinationStatus({ kind, settings }: { kind: "register" | "results"; settings: PublicSettings }) {
  const isRegister = kind === "register";
  const eventDate = new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: settings.timezone,
  }).format(new Date(settings.eventDateTime));
  const registrationCopy = {
    soon: {
      title: "Registration opens soon.",
      message: "The official registration destination is not available yet. Check back here for the confirmed link and category details.",
    },
    open: {
      title: "Registration link is being prepared.",
      message: "Registration is open. The official destination will appear here as soon as the organisers publish it.",
    },
    closed: {
      title: "Registration is closed.",
      message: "Entries for this edition have closed. Follow the event updates for race-day information.",
    },
    completed: {
      title: "Race registration has ended.",
      message: "This edition has finished. Verified timing and result information will be published through the Results page.",
    },
  }[settings.registrationStatus];
  const title = isRegister
    ? registrationCopy.title
    : settings.registrationStatus === "completed" ? "Results are being prepared." : "Results follow the finish line.";
  const message = isRegister
    ? registrationCopy.message
    : "Official timing and result information will appear here after it has been verified by the organisers.";

  return (
    <main className="status-page">
      <div className="status-page-inner">
        <div className="status-page-copy">
          <p>{settings.eventName} · {settings.organiserName}</p>
          <h1>{title}</h1>
          <p>{message}</p>
          <Link href="/" className="text-link">Return to the event <span aria-hidden="true">↗</span></Link>
        </div>
        <div className="status-page-meta">
          <p>{eventDate}</p>
          <p>{settings.venue}</p>
          <p>{settings.tagline}</p>
        </div>
      </div>
    </main>
  );
}
