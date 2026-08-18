import Link from "next/link";
import { GalleryLightbox } from "@/components/gallery/gallery-lightbox";
import type { PublicEdition, PublicSettings } from "@/lib/site-data";

export function GalleryArchive({ editions, selected, settings }: { editions: PublicEdition[]; selected: PublicEdition | null; settings: PublicSettings }) {
  const photos = selected?.photos ?? [];
  return (
    <main className="gallery-page">
      <header className="gallery-page-header">
        <div>
          <p className="gallery-count">{selected ? `${selected.editionLabel} archive · ${photos.length} ${photos.length === 1 ? "photograph" : "photographs"}` : "Edition archive"}</p>
          <h1>{selected?.name ?? settings.galleryTitle}</h1>
        </div>
        <div>
          <p>{selected?.galleryDescription || settings.galleryDescription}</p>
          <Link href="/" className="text-link">Return to the event <span aria-hidden="true">↗</span></Link>
        </div>
      </header>

      {editions.length > 0 && (
        <nav className="gallery-edition-nav" aria-label="Gallery editions">
          <span>Browse editions</span>
          <div>
            {editions.map((edition) => (
              <Link key={edition.id} href={`/gallery/${edition.slug}`} aria-current={edition.id === selected?.id ? "page" : undefined}>
                <strong>{edition.editionLabel}</strong>
                <span>{edition.name}</span>
              </Link>
            ))}
          </div>
        </nav>
      )}

      {photos.length ? <GalleryLightbox photos={photos} /> : (
        <div className="gallery-empty"><div className="gallery-empty-mark" aria-hidden="true">আগমনী</div><p>{selected ? `Photographs for ${selected.name} are still being prepared.` : "Previous-edition photographs will appear here as the archive is prepared."}</p><span>Gallery opening soon</span></div>
      )}
    </main>
  );
}
