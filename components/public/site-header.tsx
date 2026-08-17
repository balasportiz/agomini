"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { PublicNavLink, PublicSettings } from "@/lib/site-data";

export function SiteHeader({ settings, links }: { settings: PublicSettings; links: PublicNavLink[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 32);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <header className={`site-header ${scrolled || open || pathname !== "/" ? "site-header--solid" : ""}`}>
      <Link href="/#home" className="site-mark" aria-label={`${settings.eventName} home`}>
        <span>{settings.eventName}</span>
      </Link>
      <nav className="site-nav" aria-label="Primary navigation">
        {links.map(({ label, href }) => <Link key={href} href={href}>{label}</Link>)}
      </nav>
      {(settings.showRegistrationCta || settings.showResultsCta) && (
        <div className="site-actions">
          {settings.showResultsCta && <Link href="/results" className="nav-results">Results</Link>}
          {settings.showRegistrationCta && <Link href="/register" className="nav-register">Register</Link>}
        </div>
      )}
      <button
        type="button"
        className="menu-button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <X /> : <Menu />}
      </button>
      <dialog
        ref={dialogRef}
        id="mobile-menu"
        className="mobile-menu"
        aria-label="Mobile navigation"
        onClose={() => setOpen(false)}
      >
        <button type="button" className="dialog-close" aria-label="Close menu" onClick={() => setOpen(false)}><X /></button>
        <nav>
          {links.map(({ label, href }) => (
            <Link key={href} href={href} onClick={() => setOpen(false)}>{label}</Link>
          ))}
        </nav>
        {(settings.showRegistrationCta || settings.showResultsCta) && (
          <div className="mobile-menu-actions">
            {settings.showResultsCta && <Link className="action-results" href="/results" onClick={() => setOpen(false)}>View Results</Link>}
            {settings.showRegistrationCta && <Link className="action-register" href="/register" onClick={() => setOpen(false)}>Register Now</Link>}
          </div>
        )}
      </dialog>
    </header>
  );
}
