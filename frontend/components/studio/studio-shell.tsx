"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  ExternalLink,
  Flag,
  Handshake,
  Images,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu as MenuIcon,
  MessageCircleQuestion,
  Sparkles,
  Star,
  Trophy,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PreviewDrawer } from "@/components/studio/preview-drawer";
import { ChangePasswordButton } from "@/components/studio/change-password-button";
import type { StudioNavGroup } from "@/lib/studio-nav";

const ICONS: Record<string, typeof Flag> = {
  LayoutDashboard,
  Sparkles,
  Menu: MenuIcon,
  Flag,
  MapPin,
  Star,
  MessageCircleQuestion,
  Handshake,
  Images,
  Users,
  Trophy,
};

export type StudioShellUser = { name: string; email: string; roleLabel: string };

/** Maps each Studio workspace to the public page it controls. */
const PUBLIC_PAGE_FOR: { match: (path: string) => boolean; publicPath: string }[] = [
  { match: (p) => p.startsWith("/studio/galleries") || p.startsWith("/studio/media") || p.startsWith("/studio/gallery-settings"), publicPath: "/gallery" },
  { match: (p) => p.startsWith("/studio/results"), publicPath: "/results" },
  { match: (p) => p.startsWith("/studio/registration"), publicPath: "/register" },
  { match: (p) => p.startsWith("/studio/partners"), publicPath: "/#partners" },
  { match: (p) => p.startsWith("/studio/faqs"), publicPath: "/#faq" },
  { match: (p) => p.startsWith("/studio/highlights"), publicPath: "/#highlights" },
  { match: (p) => p.startsWith("/studio/race-categories"), publicPath: "/#categories" },
  { match: (p) => p.startsWith("/studio/event-logistics"), publicPath: "/#event-logistics" },
];

function publicPathFor(pathname: string): string {
  return PUBLIC_PAGE_FOR.find((rule) => rule.match(pathname))?.publicPath ?? "/";
}

export function StudioShell({
  user,
  nav,
  children,
}: {
  user: StudioShellUser;
  nav: StudioNavGroup[];
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const activeItem = nav
    .flatMap((group) => group.items)
    .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0];

  const initials = (user.name || user.email).trim().slice(0, 1).toUpperCase() || "A";
  const currentPublicPath = publicPathFor(pathname);

  async function handleLogout() {
    try {
      await fetch("/api/users/logout", { method: "POST", credentials: "include" });
    } finally {
      window.location.assign("/studio/login");
    }
  }

  return (
    <div className="studio-shell">
      <aside className="studio-sidebar" data-open={open}>
        <div className="studio-sidebar__brand">
          <span className="studio-sidebar__brand-mark" aria-hidden="true">অ</span>
          <span>
            <strong>Agomoni Studio</strong>
            <span>Race control</span>
          </span>
        </div>
        <nav className="studio-nav" aria-label="Studio sections">
          {nav.map((group) => (
            <div className="studio-nav__group" key={group.heading}>
              <p className="studio-nav__heading">{group.heading}</p>
              {group.items.map((item) => {
                const Icon = ICONS[item.icon] ?? LayoutDashboard;
                const active = activeItem?.href === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="studio-nav__link"
                    data-active={active}
                    aria-current={active ? "page" : undefined}
                  >
                    <Icon aria-hidden="true" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="studio-sidebar__status" aria-label="Publishing status">
          <span><i aria-hidden="true" /> Publishing live</span>
          <small>Saved changes sync to the website.</small>
        </div>
      </aside>
      <button
        type="button"
        className="studio-sidebar__backdrop"
        aria-label="Close menu"
        onClick={() => setOpen(false)}
      />

      <div className="studio-main">
        <header className="studio-topbar">
          <button
            type="button"
            className="studio-menu-toggle"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={18} /> : <MenuIcon size={18} />}
          </button>
          <div className="studio-topbar__title">
            <span className="studio-topbar__route">Studio / {activeItem?.label ?? "Dashboard"}</span>
            <h1>{activeItem?.label ?? "Dashboard"}</h1>
            {activeItem?.description && <p>{activeItem.description}</p>}
          </div>
          <div className="studio-topbar__actions">
            <PreviewDrawer key={currentPublicPath} initialPath={currentPublicPath} />
            <Button variant="outline" size="sm" asChild>
              <a href={currentPublicPath} target="_blank" rel="noreferrer">
                <ExternalLink /> <span>View this page</span>
              </a>
            </Button>
            <div className="studio-user">
              <span className="studio-user__meta">
                <strong>{user.name || "Account"}</strong>
                <span>{user.roleLabel}</span>
              </span>
              <span className="studio-user__avatar" aria-hidden="true">{initials}</span>
            </div>
            <ChangePasswordButton />
            <Button variant="ghost" size="icon-sm" onClick={handleLogout} aria-label="Sign out" title="Sign out">
              <LogOut />
            </Button>
          </div>
        </header>
        <main className="studio-content">{children}</main>
      </div>
    </div>
  );
}
