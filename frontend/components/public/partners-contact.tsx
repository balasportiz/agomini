import Image from "next/image";
import Link from "next/link";
import type { PublicSettings } from "@/lib/site-data";

/** Once active partners exceed this many tiles, logos switch from a static grid to a moving ticker so more logos can share the same space. */
const VISIBLE_SLOTS = 4;

function renderPartnerTile(sponsor: PublicSettings["sponsors"][number], interactive: boolean) {
  const logo = sponsor.logo ? (
    <Image src={sponsor.logo.url} alt={sponsor.logo.altText} fill sizes="12rem" unoptimized />
  ) : null;

  return (
    <li key={sponsor.name} className="partner-tile">
      {logo ? (
        interactive && sponsor.websiteUrl ? (
          <Link href={sponsor.websiteUrl} className="partner-logo" aria-label={`Visit ${sponsor.name}'s website`}>
            {logo}
          </Link>
        ) : (
          <span className="partner-logo">{logo}</span>
        )
      ) : null}
      <strong>{sponsor.name}</strong>
      {sponsor.description && <small>{sponsor.description}</small>}
    </li>
  );
}

export function PartnersContact({ settings }: { settings: PublicSettings }) {
  const sponsors = settings.sponsors.filter((sponsor) => sponsor.active);
  const overflowing = sponsors.length > VISIBLE_SLOTS;
  const eventDate = new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: settings.timezone,
  }).format(new Date(settings.eventDateTime));

  return (
    <>
      <section id="partners" className="partners-section section section--charcoal">
        <div><h2>Partners in the journey.</h2><p>Community and event partners help every runner move with confidence.</p></div>
        {sponsors.length ? (
          overflowing ? (
            <div className="partners-marquee">
              <div className="partners-marquee__track">
                <ul className="partners-marquee__group">{sponsors.map((sponsor) => renderPartnerTile(sponsor, true))}</ul>
                <ul className="partners-marquee__group" aria-hidden="true">{sponsors.map((sponsor) => renderPartnerTile(sponsor, false))}</ul>
              </div>
            </div>
          ) : (
            <ul>{sponsors.map((sponsor) => renderPartnerTile(sponsor, true))}</ul>
          )
        ) : <p className="partners-empty">Partners to be announced</p>}
      </section>
      <section id="contact" className="final-cta">
        <div className="final-cta-mark" aria-hidden="true"><span>AGOMONI</span><span>RUN</span></div>
        <div className="final-cta-copy"><p>{eventDate} · {settings.venue}</p><h2>Run for a healthy heart.<br />Don’t miss a beat.</h2>{(settings.showRegistrationCta || settings.showResultsCta) && <div>{settings.showRegistrationCta && <Link href="/register" className="button button--vermilion">Register</Link>}{settings.showResultsCta && <Link href="/results" className="button button--ghost-dark">View results</Link>}</div>}</div>
        {(settings.contactEmail || settings.primaryPhone || settings.secondaryPhone) && <address>{settings.contactEmail && <a href={`mailto:${settings.contactEmail}`}>{settings.contactEmail}</a>}{settings.primaryPhone && <a href={`tel:${settings.primaryPhone}`}>{settings.primaryPhone}</a>}{settings.secondaryPhone && <a href={`tel:${settings.secondaryPhone}`}>{settings.secondaryPhone}</a>}</address>}
      </section>
    </>
  );
}
