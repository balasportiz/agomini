import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LoadFailure } from "@/components/studio/load-failure";
import { NavigationEditor } from "@/components/studio/navigation-editor";
import { getStudioCapabilities, requireStudioUser } from "@/lib/studio-auth";
import { loadNavigation } from "@/lib/studio-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Menus & links" };

export default async function StudioNavigationPage() {
  const user = await requireStudioUser();
  if (!getStudioCapabilities(user).canEditContent) notFound();

  const nav = await loadNavigation();
  if (!nav) return <LoadFailure what="your menus and links" />;
  return <NavigationEditor initial={nav} />;
}
