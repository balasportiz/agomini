import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LoadFailure } from "@/components/studio/load-failure";
import { SiteEditor } from "@/components/studio/site-editor";
import { getStudioCapabilities, requireStudioUser } from "@/lib/studio-auth";
import { loadSiteMediaOptions, loadSiteSettings } from "@/lib/studio-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "SEO" };

export default async function StudioSeoPage() {
  const user = await requireStudioUser();
  if (!getStudioCapabilities(user).canEditContent) notFound();

  const [settings, siteImages] = await Promise.all([loadSiteSettings(), loadSiteMediaOptions()]);
  if (!settings) return <LoadFailure what="your SEO settings" />;

  return <SiteEditor initial={settings} siteImages={siteImages} defaultTab="seo" />;
}
