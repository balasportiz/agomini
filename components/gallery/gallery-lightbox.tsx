"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useRef, useState } from "react";
import type { PublicPhoto } from "@/lib/site-data";

function photoOrientation(photo: PublicPhoto): "portrait" | "landscape" | "square" {
  if (!photo.width || !photo.height) return "portrait";
  const ratio = photo.width / photo.height;
  if (ratio >= 1.2) return "landscape";
  if (ratio <= 0.85) return "portrait";
  return "square";
}

export function GalleryLightbox({ photos }: { photos: PublicPhoto[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<HTMLButtonElement | null>(null);
  const touchStart = useRef<number | null>(null);
  const active = photos[activeIndex];

  const move = (direction: -1 | 1) => {
    setActiveIndex((index) => (index + direction + photos.length) % photos.length);
  };

  const open = (index: number, opener: HTMLButtonElement) => {
    openerRef.current = opener;
    setActiveIndex(index);
    dialogRef.current?.showModal();
  };

  const restoreFocus = () => openerRef.current?.focus();

  return (
    <>
      <div className="gallery-grid">
        {photos.map((photo, index) => (
          <figure
            key={photo.id}
            className="gallery-item"
            data-orientation={photoOrientation(photo)}
            data-lead={index === 0 ? "true" : undefined}
            data-index={String(index + 1).padStart(2, "0")}
          >
            <Image src={photo.url} alt={photo.altText} fill sizes="(max-width: 820px) 50vw, 50vw" className="object-cover" unoptimized />
            <button type="button" aria-label={`Open photo ${index + 1} of ${photos.length}`} onClick={(event) => open(index, event.currentTarget)} />
            {photo.caption && <figcaption>{photo.caption}</figcaption>}
          </figure>
        ))}
      </div>
      <dialog
        ref={dialogRef}
        className="gallery-lightbox"
        aria-label="Photo viewer"
        onClose={restoreFocus}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") move(-1);
          if (event.key === "ArrowRight") move(1);
        }}
        onTouchStart={(event) => { touchStart.current = event.changedTouches[0]?.clientX ?? null; }}
        onTouchEnd={(event) => {
          if (touchStart.current == null) return;
          const distance = (event.changedTouches[0]?.clientX ?? touchStart.current) - touchStart.current;
          if (Math.abs(distance) > 50) move(distance > 0 ? -1 : 1);
          touchStart.current = null;
        }}
      >
        {active && (
          <div className="lightbox-stage">
            <button type="button" className="lightbox-close" aria-label="Close photo viewer" onClick={() => dialogRef.current?.close()}><X /></button>
            <button type="button" className="lightbox-nav lightbox-nav--prev" aria-label="Previous photo" onClick={() => move(-1)}><ChevronLeft /></button>
            <div className="lightbox-image"><Image src={active.url} alt={active.altText} fill sizes="100vw" priority unoptimized /></div>
            {active.caption && <p className="lightbox-caption">{active.caption}</p>}
            <button type="button" className="lightbox-nav lightbox-nav--next" aria-label="Next photo" onClick={() => move(1)}><ChevronRight /></button>
          </div>
        )}
      </dialog>
    </>
  );
}
