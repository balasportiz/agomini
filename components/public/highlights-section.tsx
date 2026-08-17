import type { PublicSettings } from "@/lib/site-data";

export function HighlightsSection({ highlights }: { highlights: PublicSettings["highlights"] }) {
  const active = highlights.filter((item) => item.active);
  if (!active.length) return null;
  return (
    <section id="highlights" className="section section--charcoal highlights-section">
      <div className="section-heading split-heading">
        <h2>Race day, supported from start to finish.</h2>
        <p>Practical care for every runner, delivered by organisers, volunteers and the community.</p>
      </div>
      <div className="highlight-list">
        {active.map((item, index) => (
          <article key={`${item.title}-${index}`} className="highlight-row">
            <span>{String(index + 1).padStart(2, "0")}</span>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
