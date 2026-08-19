import Image from "next/image";
import Link from "next/link";
import type { PublicSettings } from "@/lib/site-data";
import { Countdown } from "./countdown";
import { HeroMotion } from "./hero-motion";

const fallbackHero = "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=2200&q=88";

export function HeroSection({ settings, initialNow, heroImage }: {
  settings: PublicSettings;
  initialNow: string;
  heroImage?: string;
}) {
  const eventDate = new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: settings.timezone,
  }).format(new Date(settings.eventDateTime));

  return (
    <HeroMotion>
      <div className="hero-sticky">
        <div className="hero-media">
          <Image
            src={heroImage || fallbackHero}
            alt={settings.heroPhoto?.altText || `${settings.eventName} in Barasat, Kolkata — community run organised by ${settings.organiserName}`}
            fill
            priority
            sizes="100vw"
            className="hero-image"
            unoptimized={Boolean(heroImage)}
          />
          <div className="hero-scrim" />
        </div>
        <div className="hero-vermilion-field" aria-hidden="true" />

        <div className="hero-copy">
          <p className="hero-organiser">Official website of Agomoni Run · Organised by {settings.organiserName}</p>
          <h1 className="hero-lockup">
            <span>{settings.heroManifesto.wordmarkTop}</span>
            <strong>{settings.heroManifesto.wordmarkBottom} <em>{settings.heroManifesto.wordmarkYear}</em></strong>
          </h1>
          <p className="hero-kicker">Agomoni Run 2026 in Barasat, Kolkata · 3K · 5K · 10K · 15K</p>

          <div className="hero-details">
            <div className="hero-message">
              <p className="hero-heading">{settings.heroHeading}</p>
              <p className="hero-intro">{settings.heroSubheading}</p>
              {(settings.showRegistrationCta || settings.showResultsCta) && (
                <div className="hero-actions">
                  {settings.showRegistrationCta && <Link href="/register" className="button button--vermilion">Register</Link>}
                  {settings.showResultsCta && <Link href="/results" className="button button--ghost">View Results</Link>}
                </div>
              )}
            </div>
            <div className="hero-event-panel">
              <div className="hero-meta">
                <span>{eventDate}</span>
                <span>{settings.venue}</span>
              </div>
              <Countdown eventDateTime={settings.eventDateTime} initialNow={initialNow} timingConfirmed={settings.timingConfirmed} />
            </div>
          </div>
        </div>

        <div className="hero-manifesto" aria-hidden="true">
          <span>{settings.heroManifesto.bengaliWord}</span>
          <p>{settings.heroManifesto.line1}</p>
          <strong>{settings.heroManifesto.line2}</strong>
        </div>
        <div className="hero-route-line" aria-hidden="true">
          <span>{settings.heroManifesto.routeLineStart}</span><i /><span>{settings.heroManifesto.routeLineEnd}</span>
        </div>
      </div>
      <div className="hero-scroll-space" aria-hidden="true" />
    </HeroMotion>
  );
}
