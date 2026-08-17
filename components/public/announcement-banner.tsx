import Link from "next/link";
import type { PublicSettings } from "@/lib/site-data";

export function AnnouncementBanner({ announcement }: { announcement: PublicSettings["announcement"] }) {
  if (!announcement?.enabled || !announcement.text?.trim()) return null;

  const message = (duplicate = false) => (
    <span className="announcement__message" aria-hidden={duplicate || undefined}>
      <span>{announcement.text}</span>
      {announcement.linkUrl && announcement.linkLabel && (
        duplicate
          ? <span className="announcement__link-copy">{announcement.linkLabel} <span aria-hidden="true">↗</span></span>
          : <Link href={announcement.linkUrl}>{announcement.linkLabel} <span aria-hidden="true">↗</span></Link>
      )}
      <i aria-hidden="true" />
    </span>
  );

  return (
    <aside className="announcement" aria-label="Event announcement">
      <div className="announcement__track">
        {message()}
        {message(true)}
      </div>
    </aside>
  );
}
