import Link from "next/link";
import type { PublicNavLink, PublicSettings } from "@/lib/site-data";

export function SiteFooter({ settings, links }: { settings: PublicSettings; links: PublicNavLink[] }) {
  const eventDate = new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: settings.timezone,
  }).format(new Date(settings.eventDateTime));
  const registrationLabel = settings.registrationStatus === "open"
    ? "Register now"
    : settings.registrationStatus === "completed" ? "Race completed" : "Registration details";
  const resultsLabel = settings.registrationStatus === "completed" ? "View results" : "Results status";
  const socialLinks = [
    settings.instagramUrl && ["Instagram", settings.instagramUrl],
    settings.facebookUrl && ["Facebook", settings.facebookUrl],
    settings.youtubeUrl && ["YouTube", settings.youtubeUrl],
  ].filter((item): item is [string, string] => Boolean(item));

  return (
    <footer className="site-footer">
      <div className="footer-callout">
        <div>
          <p>{settings.eventName}</p>
          <h2>{settings.tagline}</h2>
        </div>
        {(settings.showRegistrationCta || settings.showResultsCta) && (
          <div className="footer-actions">
            {settings.showRegistrationCta && <Link className="action-register" href="/register">{registrationLabel}<span aria-hidden="true">↗</span></Link>}
            {settings.showResultsCta && <Link className="action-results" href="/result">{resultsLabel}<span aria-hidden="true">↗</span></Link>}
          </div>
        )}
      </div>

      <div className="footer-route" aria-hidden="true"><span>{eventDate}</span><i /><span>{settings.venue}</span></div>

      <div className="footer-main">
        <div className="footer-brand">
          <strong>AGOMONI</strong><span>RUN 2.0</span>
          <p>{settings.organiserDescription}</p>
        </div>
        <div className="footer-group footer-event">
          <h3>Event</h3><strong>{eventDate}</strong><p>{settings.venue}</p>
          {!settings.timingConfirmed && <small>Start time to be confirmed</small>}
        </div>
        <nav className="footer-group" aria-label="Footer navigation">
          <h3>Explore</h3><ul>{links.map(({ label, href }) => <li key={href}><Link href={href}>{label}</Link></li>)}</ul>
        </nav>
        {(settings.contactEmail || settings.primaryPhone || socialLinks.length > 0) && (
          <div className="footer-group footer-connect">
            <h3>Connect</h3>
            <address>
              {settings.contactEmail && <a href={`mailto:${settings.contactEmail}`}>{settings.contactEmail}</a>}
              {settings.primaryPhone && <a href={`tel:${settings.primaryPhone.replace(/[^+\d]/g, "")}`}>{settings.primaryPhone}</a>}
            </address>
            {socialLinks.length > 0 && <nav aria-label="Social media"><ul>{socialLinks.map(([label, href]) => <li key={label}><Link href={href}>{label}</Link></li>)}</ul></nav>}
          </div>
        )}
      </div>

      <div className="footer-bottom"><span>© {new Date().getFullYear()} {settings.organiserName}</span><span>Agomoni Run is Barasat&rsquo;s official community running event</span></div>
    </footer>
  );
}
