import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GalleriesManager } from "@/components/studio/galleries-manager";
import { getStudioCapabilities, requireStudioUser } from "@/lib/studio-auth";
import { loadEventEditions, loadFeaturedGalleryEditionId, loadGalleryMedia } from "@/lib/studio-data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Gallery editions" };

export default async function StudioGalleriesPage() {
  const user = await requireStudioUser();
  const capabilities = getStudioCapabilities(user);
  if (!capabilities.canEditContent || !capabilities.canManageMedia) notFound();

  const [editions, photos, featuredEditionId] = await Promise.all([
    loadEventEditions(),
    loadGalleryMedia(),
    loadFeaturedGalleryEditionId(),
  ]);

  const renderKey = JSON.stringify([featuredEditionId, editions, photos]);

  return (
    <GalleriesManager
      key={renderKey}
      initialEditions={editions}
      initialPhotos={photos}
      initialFeaturedEditionId={featuredEditionId}
    />
  );
}
