import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GalleryArchive } from "@/components/gallery/gallery-archive";
import { loadPublicSiteData } from "@/lib/site-data";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ editionSlug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { editionSlug } = await params;
  const { editions } = await loadPublicSiteData();
  const edition = editions.find((item) => item.slug === editionSlug);
  if (!edition) return { title: "Gallery edition" };
  return {
    title: `${edition.name} Gallery`,
    description: edition.galleryDescription || `Photographs from ${edition.name}.`,
    alternates: { canonical: `/gallery/${edition.slug}` },
  };
}

export default async function GalleryEditionPage({ params }: PageProps) {
  const { editionSlug } = await params;
  const { editions, settings } = await loadPublicSiteData();
  const selected = editions.find((edition) => edition.slug === editionSlug);
  if (!selected) notFound();
  return <GalleryArchive editions={editions} selected={selected} settings={settings} />;
}
