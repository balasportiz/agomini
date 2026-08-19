import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CollectionEditor, type StudioFieldDef } from "@/components/studio/collection-editor";
import { getStudioCapabilities, requireStudioUser } from "@/lib/studio-auth";
import { loadEventEditions } from "@/lib/studio-data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Results archive" };

const fields: StudioFieldDef[] = [
  { name: "name", label: "Edition name", type: "text", required: true, placeholder: "Agomoni Run 2.0" },
  { name: "editionLabel", label: "Short edition label", type: "text", required: true, placeholder: "2.0", help: "Shown in archive navigation and compact labels." },
  { name: "slug", label: "Gallery URL slug", type: "text", required: true, placeholder: "agomoni-run-2-0", help: "Use lowercase letters, numbers and hyphens." },
  { name: "eventDate", label: "Event date", type: "date", help: "Used to order the newest and previous editions." },
  { name: "resultsUrl", label: "Official results link", type: "url", placeholder: "https://timing-provider.example/results", help: "Leave empty until the verified timing page is ready." },
  { name: "resultsPublished", label: "Results are available", type: "toggle", help: "Visitors only see the results button when this is enabled and a link is present." },
  { name: "showInResults", label: "Show on the results page", type: "toggle", help: "This switch only affects /results. Gallery visibility is set in Galleries." },
];

export default async function StudioResultsPage() {
  const user = await requireStudioUser();
  if (!getStudioCapabilities(user).canEditContent) notFound();

  const editions = await loadEventEditions();
  return (
    <CollectionEditor
      collection="event-editions"
      singular="Edition"
      plural="Results archive"
      description="Create each race edition once, then publish its verified results link. The Live switch on this page only shows or hides the edition on /results — gallery visibility stays in Galleries."
      titleField="name"
      subtitleField="resultsUrl"
      fields={fields}
      defaults={{ name: "", editionLabel: "", slug: "", eventDate: "", resultsUrl: "", resultsPublished: false, showInResults: false }}
      initialRows={editions}
      mediaOptions={[]}
      visibilityField="showInResults"
    />
  );
}
