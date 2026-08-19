import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteEditor } from "@/components/studio/site-editor";
import { getStudioCapabilities, requireStudioUser } from "@/lib/studio-auth";
import { loadSiteMediaOptions, loadSiteSettings } from "@/lib/studio-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Site & story" };

export default async function StudioSitePage() {
  const user = await requireStudioUser();
  if (!getStudioCapabilities(user).canEditContent) notFound();

  const [settings, siteImages] = await Promise.all([loadSiteSettings(), loadSiteMediaOptions()]);

  return <SiteEditor initial={settings} siteImages={siteImages} />;
}
