import { FaqSection } from "@/components/public/faq-section";
import { EventLogistics } from "@/components/public/event-logistics";
import { GalleryPreview } from "@/components/public/gallery-preview";
import { HeroSection } from "@/components/public/hero-section";
import { HighlightsSection } from "@/components/public/highlights-section";
import { PartnersContact } from "@/components/public/partners-contact";
import { RaceCategories } from "@/components/public/race-categories";
import { StorySections } from "@/components/public/story-sections";
import { loadPublicSiteData } from "@/lib/site-data";
import { buildSiteJsonLd, jsonLdScript } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { settings, categories, logistics, photos, homepageEdition } = await loadPublicSiteData();

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(buildSiteJsonLd(settings)) }} />
      <HeroSection settings={settings} initialNow={new Date().toISOString()} heroImage={settings.heroPhoto?.url} />
      <RaceCategories categories={categories} showRegistrationCta={settings.showRegistrationCta} />
      <EventLogistics entries={logistics} timezone={settings.timezone} heading={settings.logisticsHeading} subheading={settings.logisticsSubheading} />
      <StorySections settings={settings} />
      <HighlightsSection highlights={settings.highlights} />
      <GalleryPreview photos={photos.slice(0, 8)} settings={settings} edition={homepageEdition} />
      <PartnersContact settings={settings} />
      <FaqSection faqs={settings.faqs} />
    </main>
  );
}
