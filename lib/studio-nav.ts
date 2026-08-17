import type { StudioCapabilities } from "@/lib/studio-auth";

export type StudioNavItem = {
  label: string;
  href: string;
  /** Lucide icon name, resolved in the client sidebar. */
  icon: string;
  description: string;
  /** Which capability is required to see this item. */
  requires: keyof StudioCapabilities;
};

export type StudioNavGroup = {
  heading: string;
  items: StudioNavItem[];
};

export const STUDIO_NAV: StudioNavGroup[] = [
  {
    heading: "Overview",
    items: [
      { label: "Dashboard", href: "/studio", icon: "LayoutDashboard", description: "Everything at a glance", requires: "canEditContent" },
    ],
  },
  {
    heading: "Your website",
    items: [
      { label: "Site & story", href: "/studio/site", icon: "Sparkles", description: "Event details, hero and story text", requires: "canEditContent" },
      { label: "Menus & links", href: "/studio/navigation", icon: "Menu", description: "Header and footer navigation", requires: "canEditContent" },
      { label: "Registration", href: "/studio/registration", icon: "Flag", description: "Registration status, link and buttons", requires: "canEditContent" },
      { label: "Results", href: "/studio/results", icon: "Trophy", description: "Edition archive and official results links", requires: "canEditContent" },
      { label: "Galleries", href: "/studio/galleries", icon: "Images", description: "Edition photos, uploads and homepage archive", requires: "canEditContent" },
    ],
  },
  {
    heading: "Content",
    items: [
      { label: "Race categories", href: "/studio/race-categories", icon: "Flag", description: "Distances, fees and timings", requires: "canEditContent" },
      { label: "Event day info", href: "/studio/event-logistics", icon: "MapPin", description: "Arrival and bib collection", requires: "canEditContent" },
      { label: "Highlights", href: "/studio/highlights", icon: "Star", description: "Race-day support callouts", requires: "canEditContent" },
      { label: "FAQs", href: "/studio/faqs", icon: "MessageCircleQuestion", description: "Questions and answers", requires: "canEditContent" },
      { label: "Partners", href: "/studio/partners", icon: "Handshake", description: "Sponsors and partners", requires: "canEditContent" },
    ],
  },
  {
    heading: "Administration",
    items: [
      { label: "Accounts", href: "/studio/accounts", icon: "Users", description: "People who can edit the site", requires: "canManageAccounts" },
    ],
  },
];

/** Filters the nav down to what the given capabilities allow. */
export function visibleNav(caps: StudioCapabilities): StudioNavGroup[] {
  return STUDIO_NAV.map((group) => ({
    ...group,
    items: group.items.filter((item) => caps[item.requires]),
  })).filter((group) => group.items.length > 0);
}
