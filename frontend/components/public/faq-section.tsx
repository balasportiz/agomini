import type { PublicSettings } from "@/lib/site-data";

export function FaqSection({ faqs }: { faqs: PublicSettings["faqs"] }) {
  const active = faqs.filter((faq) => faq.active);
  if (!active.length) return null;
  return (
    <section id="faq" className="section section--ivory faq-section">
      <div className="section-heading split-heading">
        <h2>Before you reach the start line.</h2>
        <p>Key race-day information will be updated here as details are confirmed.</p>
      </div>
      <div className="faq-list">
        {active.map((faq, index) => (
          <details key={`${faq.question}-${index}`}>
            <summary><span>{faq.question}</span><span aria-hidden="true">+</span></summary>
            <p>{faq.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
