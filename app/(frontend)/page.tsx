import { FaqSection } from "@/components/public/faq-section";
import { EventLogistics } from "@/components/public/event-logistics";
import { GalleryPreview } from "@/components/public/gallery-preview";
import { HeroSection } from "@/components/public/hero-section";
import { HighlightsSection } from "@/components/public/highlights-section";
import { PartnersContact } from "@/components/public/partners-contact";
import { RaceCategories } from "@/components/public/race-categories";
import { StorySections } from "@/components/public/story-sections";
import { loadPublicSiteData } from "@/lib/site-data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { settings, categories, logistics, photos } = await loadPublicSiteData();
  const eventJsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: settings.eventName,
    startDate: settings.eventDateTime,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: { "@type": "Place", name: settings.venue, address: settings.venue },
    organizer: { "@type": "Organization", name: settings.organiserName },
    description: settings.heroSubheading,
    url: new URL("/", process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").toString(),
  }).replace(/</g, "\\u003c");

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: eventJsonLd }} />
      <HeroSection settings={settings} initialNow={new Date().toISOString()} heroImage={settings.heroPhoto?.url} />
      <RaceCategories categories={categories} showRegistrationCta={settings.showRegistrationCta} />
      <EventLogistics entries={logistics} timezone={settings.timezone} />
      <StorySections settings={settings} />
      <HighlightsSection highlights={settings.highlights} />
      <GalleryPreview photos={photos.slice(0, 8)} settings={settings} />
      <PartnersContact settings={settings} />
      <FaqSection faqs={settings.faqs} />
    </main>
  );
}
