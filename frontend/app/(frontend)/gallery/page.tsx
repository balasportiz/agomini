import type { Metadata } from "next";
import { GalleryArchive } from "@/components/gallery/gallery-archive";
import { loadPublicSiteData } from "@/lib/site-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Gallery",
  description: "Photographs from every published Agomoni Run edition and the Barasat running community.",
  alternates: { canonical: "/gallery" },
};

export default async function GalleryPage() {
  const { editions, settings } = await loadPublicSiteData();
  const selected = editions.find((edition) => edition.photos.length > 0) ?? editions[0] ?? null;
  return <GalleryArchive editions={editions} selected={selected} settings={settings} />;
}
