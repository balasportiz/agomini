import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CollectionEditor, type StudioFieldDef } from "@/components/studio/collection-editor";
import { getStudioCapabilities, requireStudioUser } from "@/lib/studio-auth";
import { loadCollectionRows } from "@/lib/studio-data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Race categories" };

const fields: StudioFieldDef[] = [
  { name: "name", label: "Name", type: "text", required: true, placeholder: "e.g. 5K" },
  { name: "distance", label: "Distance", type: "text", required: true, placeholder: "e.g. 5 kilometres" },
  { name: "fee", label: "Entry fee", type: "text", placeholder: "To be announced" },
  { name: "reportingTime", label: "Reporting time", type: "text", placeholder: "To be announced" },
  { name: "startTime", label: "Flag-off time", type: "text", placeholder: "To be announced" },
  { name: "description", label: "Description", type: "textarea", required: true },
  { name: "ageEligibility", label: "Age eligibility", type: "text", help: "Optional." },
  { name: "inclusions", label: "What's included", type: "string-list", itemLabel: "inclusion", help: "Only list confirmed inclusions." },
  { name: "active", label: "Show on website", type: "toggle" },
];

export default async function StudioRaceCategoriesPage() {
  const user = await requireStudioUser();
  if (!getStudioCapabilities(user).canEditContent) notFound();
  const rows = await loadCollectionRows("race-categories");

  return (
    <CollectionEditor
      collection="race-categories"
      singular="Category"
      plural="Race categories"
      description="Distances, fees and race-day times shown in the Categories section."
      titleField="name"
      subtitleField="distance"
      fields={fields}
      defaults={{ name: "", distance: "", fee: "To be announced", reportingTime: "To be announced", startTime: "To be announced", description: "", ageEligibility: "", inclusions: [], active: true }}
      initialRows={rows}
      mediaOptions={[]}
      orderable
    />
  );
}
