import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CollectionEditor, type StudioFieldDef } from "@/components/studio/collection-editor";
import { getStudioCapabilities, requireStudioUser } from "@/lib/studio-auth";
import { loadCollectionRows, loadMediaOptions } from "@/lib/studio-data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Highlights" };

const fields: StudioFieldDef[] = [
  { name: "title", label: "Title", type: "text", required: true },
  { name: "description", label: "Description", type: "textarea", required: true },
  { name: "photo", label: "Photo", type: "media", mediaLabel: "photo", help: "Optional image for this highlight." },
  { name: "active", label: "Show on website", type: "toggle" },
];

export default async function StudioHighlightsPage() {
  const user = await requireStudioUser();
  if (!getStudioCapabilities(user).canEditContent) notFound();
  const [rows, mediaOptions] = await Promise.all([loadCollectionRows("highlights"), loadMediaOptions()]);

  return (
    <CollectionEditor
      collection="highlights"
      singular="Highlight"
      plural="Highlights"
      description="Race-day support and key information shown on the homepage."
      titleField="title"
      fields={fields}
      defaults={{ title: "", description: "", photo: null, active: true }}
      initialRows={rows}
      mediaOptions={mediaOptions}
    />
  );
}
