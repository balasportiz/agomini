import type { Metadata } from "next";
import Link from "next/link";
import { safeExternalDestination } from "@/lib/redirects";
import { loadPublicSiteData } from "@/lib/site-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Results archive",
  description: "Official Agomoni Run results archive. Verified timing links for published editions from Barasat Runners.",
  alternates: { canonical: "/results" },
};

export default async function ResultsPage() {
  const { resultEditions } = await loadPublicSiteData();
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  return (
    <main className="results-page">
      <header className="results-page__header">
        <p>Official edition archive</p>
        <h1>Results, race by race.</h1>
        <span>Verified timing links are published here without replacing the history of earlier editions.</span>
      </header>

      {resultEditions.length > 0 ? (
        <div className="results-archive">
          {resultEditions.map((edition, index) => {
            const destination = edition.resultsPublished
              ? safeExternalDestination(edition.resultsUrl, baseUrl, "/results")
              : null;
            return (
              <article className="results-edition" key={edition.id}>
                <span className="results-edition__index">{String(index + 1).padStart(2, "0")}</span>
                <div className="results-edition__identity">
                  <strong>{edition.editionLabel}</strong>
                  <h2>{edition.name}</h2>
                  {edition.eventDate && <time dateTime={edition.eventDate}>{new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" }).format(new Date(edition.eventDate))}</time>}
                </div>
                <div className="results-edition__status">
                  {destination ? <><span data-ready="true">Results verified</span><a href={destination} target="_blank" rel="noreferrer">Open official results <span aria-hidden="true">↗</span></a></> : <><span>Results pending</span><p>The official timing link has not been published for this edition.</p></>}
                  <Link href={`/gallery/${edition.slug}`}>View photo archive <span aria-hidden="true">→</span></Link>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="results-empty"><strong>Archive opening soon.</strong><p>Published race editions and their verified results links will appear here.</p></div>
      )}
    </main>
  );
}
