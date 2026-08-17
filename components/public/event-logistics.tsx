import type { PublicEventLogistic } from "@/lib/site-data";

export function EventLogistics({ entries, timezone }: { entries: PublicEventLogistic[]; timezone: string }) {
  if (!entries.length) return null;

  const formatter = new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: timezone,
  });

  return (
    <section id="event-logistics" className="event-logistics">
      <header className="logistics-heading">
        <h2>Arrive informed.<br />Run with confidence.</h2>
        <p>Everything runners need to reach race day and collect their bib without uncertainty.</p>
      </header>
      <div className="logistics-list">
        {entries.map((entry, index) => (
          <article className="logistics-entry" key={entry.id}>
            <span className="logistics-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
            <div className="logistics-place">
              <p>{entry.type === "race-day" ? "Race day venue" : "Bib expo venue"}</p>
              <h3>{entry.title}</h3>
              <time dateTime={entry.dateTime}>{formatter.format(new Date(entry.dateTime))}</time>
            </div>
            <div className="logistics-directions">
              <address><strong>{entry.venue}</strong><span>{entry.address}</span></address>
              <p>{entry.directions}</p>
            </div>
            {entry.mapUrl && <a className="logistics-map" href={entry.mapUrl} target="_blank" rel="noreferrer">Open map <span aria-hidden="true">↗</span></a>}
          </article>
        ))}
      </div>
    </section>
  );
}
