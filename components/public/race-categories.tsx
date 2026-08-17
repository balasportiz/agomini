import Link from "next/link";
import type { PublicCategory } from "@/lib/site-data";

export function RaceCategories({ categories, showRegistrationCta }: { categories: PublicCategory[]; showRegistrationCta: boolean }) {
  return (
    <section id="categories" className="section section--ivory race-section">
      <div className="section-heading split-heading">
        <h2>Choose your distance.</h2>
        <p>Three ways to carry one message through Barasat: movement, community and a healthy heart.</p>
      </div>
      <div className="race-list">
        {categories.map((category, index) => (
          <article key={category.id} className="race-row">
            <div className="race-index">{String(index + 1).padStart(2, "0")}</div>
            <div className="race-distance">
              <strong>{category.name}</strong>
              <span>{category.distance}</span>
            </div>
            <p>{category.description}</p>
            <dl className="race-facts">
              <div><dt>Entry</dt><dd>{category.fee}</dd></div>
              <div><dt>Report</dt><dd>{category.reportingTime}</dd></div>
              <div><dt>Flag-off</dt><dd>{category.startTime}</dd></div>
            </dl>
            {showRegistrationCta && (
              <Link href="/register" className="race-link" aria-label={`Register for ${category.name}`}>
                Register <span aria-hidden="true">↗</span>
              </Link>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
