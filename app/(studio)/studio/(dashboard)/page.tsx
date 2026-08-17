import type { Metadata } from "next";
import Link from "next/link";
import { getPayload, type Where } from "payload";
import config from "@payload-config";
import {
  Flag,
  GalleryHorizontalEnd,
  Handshake,
  Images,
  MapPin,
  MessageCircleQuestion,
  Sparkles,
  Star,
  Menu as MenuIcon,
  Trophy,
  Users,
} from "lucide-react";
import { getStudioCapabilities, requireStudioUser } from "@/lib/studio-auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Dashboard" };

type CountKey = "race-categories" | "event-logistics" | "event-editions" | "highlights" | "faqs" | "sponsors" | "media";

async function safeCount(payload: Awaited<ReturnType<typeof getPayload>>, collection: CountKey, where?: Where) {
  try {
    const result = await payload.count({ collection, overrideAccess: true, ...(where ? { where } : {}) });
    return result.totalDocs;
  } catch {
    return 0;
  }
}

export default async function StudioDashboardPage() {
  const user = await requireStudioUser();
  const caps = getStudioCapabilities(user);
  const payload = await getPayload({ config });

  const [categories, logistics, editions, highlights, faqs, partners, mediaTotal, mediaActive] = await Promise.all([
    safeCount(payload, "race-categories"),
    safeCount(payload, "event-logistics"),
    safeCount(payload, "event-editions"),
    safeCount(payload, "highlights"),
    safeCount(payload, "faqs"),
    safeCount(payload, "sponsors"),
    safeCount(payload, "media"),
    safeCount(payload, "media", { active: { equals: true } }),
  ]);

  const firstName = (user.name || "there").split(" ")[0];

  const stats = [
    { label: "Race categories", value: categories, icon: Flag, href: "/studio/race-categories" },
    { label: "FAQs", value: faqs, icon: MessageCircleQuestion, href: "/studio/faqs" },
    { label: "Highlights", value: highlights, icon: Star, href: "/studio/highlights" },
    { label: "Partners", value: partners, icon: Handshake, href: "/studio/partners" },
    { label: "Event day entries", value: logistics, icon: MapPin, href: "/studio/event-logistics" },
    { label: "Editions", value: editions, icon: Trophy, href: "/studio/results" },
    ...(caps.canManageMedia
      ? [{ label: "Gallery photos", value: mediaTotal, icon: Images, href: "/studio/galleries", sub: `${mediaActive} live assets` }]
      : []),
  ];

  const quicklinks = [
    { title: "Edit site & story", desc: "Event details, hero and story text", icon: Sparkles, href: "/studio/site", show: caps.canEditContent },
    { title: "Menus & links", desc: "Header and footer navigation", icon: MenuIcon, href: "/studio/navigation", show: caps.canEditContent },
    { title: "Registration", desc: "Registration status, destination and buttons", icon: Flag, href: "/studio/registration", show: caps.canEditContent },
    { title: "Results archive", desc: "Edition records and official timing links", icon: Trophy, href: "/studio/results", show: caps.canEditContent },
    { title: "Gallery editions", desc: "Edition photos, uploads and homepage selection", icon: GalleryHorizontalEnd, href: "/studio/galleries", show: caps.canEditContent && caps.canManageMedia },
    { title: "Accounts", desc: "Manage who can edit the site", icon: Users, href: "/studio/accounts", show: caps.canManageAccounts },
  ].filter((q) => q.show);

  return (
    <div className="studio-content__inner studio-content__inner--wide studio-dashboard">
      <div className="studio-page-head studio-page-head--dashboard">
        <div className="studio-page-head__copy">
          <span className="studio-page-head__signal"><i aria-hidden="true" /> Website connected</span>
          <h2>Race control, {firstName}.</h2>
          <p>Shape the Agomoni Run story, keep event details accurate, and publish updates without leaving this workspace.</p>
        </div>
        <div className="studio-dashboard__dateline" aria-label="Studio publishing status">
          <span>Live workspace</span>
          <strong>Agomoni Run</strong>
          <small>Save once. The website follows.</small>
        </div>
      </div>

      <section className="studio-overview" aria-labelledby="content-pulse-title">
        <div className="studio-section-title">
          <div>
            <h3 id="content-pulse-title">Content pulse</h3>
            <p>A live count of the stories, details, and images behind the event.</p>
          </div>
          <span>{stats.length} collections</span>
        </div>
        <div className="studio-stat-grid" aria-label="Content overview">
          {stats.map((stat) => (
            <Link key={stat.label} href={stat.href} className="studio-stat" data-featured={"sub" in stat && Boolean(stat.sub)}>
              <span className="studio-stat__top">
                <span className="studio-stat__label">
                  <stat.icon aria-hidden="true" /> {stat.label}
                </span>
                <span className="studio-stat__arrow" aria-hidden="true">↗</span>
              </span>
              <span className="studio-stat__value">{stat.value}</span>
              {"sub" in stat && stat.sub ? <span className="studio-stat__sub">{stat.sub}</span> : <span className="studio-stat__sub">Ready to edit</span>}
            </Link>
          ))}
        </div>
      </section>

      {quicklinks.length > 0 && (
        <section className="studio-workspaces" aria-labelledby="workspaces-title">
          <div className="studio-section-title">
            <div>
              <h3 id="workspaces-title">Continue editing</h3>
              <p>Go straight to the part of the website you want to move.</p>
            </div>
            <span>{quicklinks.length} workspaces</span>
          </div>
          <div className="studio-quicklinks">
            {quicklinks.map((link) => (
              <Link key={link.href} href={link.href} className="studio-quicklink">
                <span className="studio-quicklink__icon">
                  <link.icon aria-hidden="true" />
                </span>
                <span className="studio-quicklink__copy">
                  <strong>{link.title}</strong>
                  <span>{link.desc}</span>
                </span>
                <span className="studio-quicklink__arrow" aria-hidden="true">↗</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
