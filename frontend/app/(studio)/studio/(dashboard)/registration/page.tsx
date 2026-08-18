import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteEditor } from "@/components/studio/site-editor";
import { getStudioCapabilities, requireStudioUser } from "@/lib/studio-auth";
import { loadMediaOptions, loadSiteSettings } from "@/lib/studio-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Registration" };

/**
 * Deep-links straight into the Site & story editor's "Hero & buttons" tab,
 * which is where the /register and /results destinations, registration
 * status and Register/Results button visibility all live. Kept as its own
 * sidebar entry so these controls are easy to find on their own.
 */
export default async function StudioRegistrationPage() {
  const user = await requireStudioUser();
  if (!getStudioCapabilities(user).canEditContent) notFound();

  const [settings, mediaOptions] = await Promise.all([loadSiteSettings(), loadMediaOptions()]);

  return <SiteEditor initial={settings} mediaOptions={mediaOptions} defaultTab="hero" />;
}
