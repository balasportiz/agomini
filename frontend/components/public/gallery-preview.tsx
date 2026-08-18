import Image from "next/image";
import Link from "next/link";
import type { PublicEdition, PublicPhoto, PublicSettings } from "@/lib/site-data";

function photoOrientation(photo: PublicPhoto): "portrait" | "landscape" | "square" {
  if (!photo.width || !photo.height) return "portrait";
  const ratio = photo.width / photo.height;
  if (ratio >= 1.2) return "landscape";
  if (ratio <= 0.85) return "portrait";
  return "square";
}

export function GalleryPreview({
  photos,
  settings,
  edition,
}: {
  photos: PublicPhoto[];
  settings: PublicSettings;
  edition?: PublicEdition | null;
}) {
  const title = edition?.name || settings.galleryTitle;
  const description = edition?.galleryDescription || settings.galleryDescription;
  return (
    <section id="gallery" className="section section--ivory gallery-preview">
      <div className="gallery-heading">
        <div><h2>{title}</h2><p>{description}</p></div>
        <Link href="/gallery" className="text-link">View full gallery <span aria-hidden="true">↗</span></Link>
      </div>
      {photos.length ? (
        <div className="gallery-grid">
          {photos.map((photo, index) => (
            <figure
              key={photo.id}
              className="gallery-item"
              data-orientation={photoOrientation(photo)}
              data-lead={index === 0 ? "true" : undefined}
              data-index={String(index + 1).padStart(2, "0")}
            >
              <Image
                src={photo.url}
                alt={photo.altText}
                fill
                sizes="(max-width: 820px) 50vw, 50vw"
                className="object-cover"
                unoptimized
              />
              {photo.caption && <figcaption>{photo.caption}</figcaption>}
            </figure>
          ))}
        </div>
      ) : (
        <div className="gallery-empty">
          <div className="gallery-empty-mark" aria-hidden="true">আগমনী</div>
          <p>Previous-edition photographs will appear here as the archive is prepared.</p>
          <span>Gallery opening soon</span>
        </div>
      )}
    </section>
  );
}
