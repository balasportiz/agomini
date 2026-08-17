import Image from "next/image";
import Link from "next/link";
import type { PublicSettings } from "@/lib/site-data";
import { StoryMotion } from "./story-motion";

const fallbackCommunityRun = "https://images.unsplash.com/photo-1486218119243-13883505764c?auto=format&fit=crop&w=1900&q=86";
const fallbackRoadRunner = "https://images.unsplash.com/photo-1502904550040-7534597429ae?auto=format&fit=crop&w=1900&q=86";

export function StorySections({ settings }: { settings: PublicSettings }) {
  const eventDate = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
    timeZone: settings.timezone,
  }).format(new Date(settings.eventDateTime));
  const { storyChapter, communityChapter } = settings;

  return (
    <>
      <section id="about" className="section section--vermilion about-section">
        <div className="about-title"><span aria-hidden="true">{settings.aboutBengaliWord}</span><h2>{settings.aboutHeading}</h2></div>
        <div className="about-copy"><p>{settings.about}</p><p>{settings.organiserDescription}</p></div>
        <div className="about-route" aria-hidden="true"><span>START</span><i /><span>{eventDate}</span><i /><span>{settings.venue}</span></div>
      </section>

      <StoryMotion>
        <div className="story-frame">
          <div className="story-media">
            <Image src={storyChapter.image?.url || fallbackCommunityRun} alt={storyChapter.imageAlt} fill sizes="100vw" className="object-cover story-image" unoptimized={Boolean(storyChapter.image?.url)} />
          </div>
          <div className="story-overlay" />
          <div className="story-safety-word" aria-hidden="true">{storyChapter.word}</div>
          <div className="story-copy"><p>{storyChapter.lead}</p><h2>{storyChapter.heading}</h2></div>
        </div>
      </StoryMotion>

      <section className="section section--ivory community-section">
        <div className="community-image">
          <Image src={communityChapter.image?.url || fallbackRoadRunner} alt={communityChapter.imageAlt} fill sizes="(max-width: 900px) 100vw, 58vw" className="object-cover" unoptimized={Boolean(communityChapter.image?.url)} />
          <span aria-hidden="true">{communityChapter.tag}</span>
        </div>
        <div className="community-copy"><h2>{communityChapter.heading}</h2><p>{communityChapter.body}</p>{settings.showRegistrationCta && <Link href="/register" className="button button--dark">{communityChapter.ctaLabel}</Link>}</div>
      </section>
    </>
  );
}
