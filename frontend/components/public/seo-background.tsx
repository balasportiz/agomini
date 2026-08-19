import type { PublicSettings } from "@/lib/site-data";

/** Keyword copy for crawlers. Invisible on the page (opacity 0) so the design stays clean. */
export function SeoBackground({ settings }: { settings: PublicSettings }) {
  return (
    <div className="seo-background">
      <p>
        Official website of Agomoni Run, also known as Agomoni Run 2.0 and Agomoni Run 2026, organised by {settings.organiserName} in Barasat, Kolkata, West Bengal.
        Community races include 3K, 5K, 10K and 15K. Venue: {settings.venue}. Date: {settings.eventDateTime}. Register, race-day information, gallery and results: agomonirun.com.
      </p>
    </div>
  );
}
