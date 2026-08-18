import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CollectionEditor, type StudioFieldDef } from "@/components/studio/collection-editor";
import { getStudioCapabilities, requireStudioUser } from "@/lib/studio-auth";
import { loadCollectionRows } from "@/lib/studio-data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Event day info" };

const fields: StudioFieldDef[] = [
  { name: "title", label: "Title", type: "text", required: true, placeholder: "e.g. Race day venue" },
  {
    name: "type",
    label: "Type",
    type: "select",
    options: [
      { value: "race-day", label: "Race day" },
      { value: "bib-expo", label: "Bib expo" },
    ],
  },
  { name: "venue", label: "Venue", type: "text", required: true },
  { name: "address", label: "Address", type: "textarea", required: true },
  { name: "dateTime", label: "Date & time", type: "date", required: true },
  { name: "directions", label: "How runners should arrive", type: "textarea", required: true },
  { name: "mapUrl", label: "Map link", type: "url", help: "Optional Google Maps or other HTTP(S) link." },
  { name: "active", label: "Show on website", type: "toggle" },
];

export default async function StudioEventLogisticsPage() {
  const user = await requireStudioUser();
  if (!getStudioCapabilities(user).canEditContent) notFound();
  const rows = await loadCollectionRows("event-logistics");

  return (
    <CollectionEditor
      collection="event-logistics"
      singular="Entry"
      plural="Event day info"
      description="Race-day arrival and bib-collection details."
      titleField="title"
      subtitleField="venue"
      fields={fields}
      defaults={{ title: "", type: "race-day", venue: "", address: "", dateTime: "", directions: "", mapUrl: "", active: true }}
      initialRows={rows}
      mediaOptions={[]}
    />
  );
}
