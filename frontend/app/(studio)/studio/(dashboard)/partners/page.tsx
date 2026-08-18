import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CollectionEditor, type StudioFieldDef } from "@/components/studio/collection-editor";
import { getStudioCapabilities, requireStudioUser } from "@/lib/studio-auth";
import { loadCollectionRows, loadMediaOptions } from "@/lib/studio-data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Partners" };

const fields: StudioFieldDef[] = [
  { name: "name", label: "Partner name", type: "text", required: true },
  { name: "logo", label: "Logo", type: "media", mediaLabel: "logo", help: "Choose an image with descriptive alt text." },
  { name: "websiteUrl", label: "Website", type: "url", placeholder: "https://…" },
  { name: "description", label: "Description", type: "textarea", help: "Optional short description." },
  { name: "active", label: "Show on website", type: "toggle" },
];

export default async function StudioPartnersPage() {
  const user = await requireStudioUser();
  if (!getStudioCapabilities(user).canEditContent) notFound();
  const [rows, mediaOptions] = await Promise.all([loadCollectionRows("sponsors"), loadMediaOptions()]);

  return (
    <CollectionEditor
      collection="sponsors"
      singular="Partner"
      plural="Partners"
      description="Confirmed event and community partners. Nothing shows publicly until it's set to Live."
      titleField="name"
      fields={fields}
      defaults={{ name: "", logo: null, websiteUrl: "", description: "", active: true }}
      initialRows={rows}
      mediaOptions={mediaOptions}
    />
  );
}
