import type { CollectionConfig } from "payload";
import { editorOrAbove, publicReadActive } from "@/lib/access";
import { adminPreview } from "@/lib/admin-preview";
import { notifyOnChangeHooks } from "@/lib/realtime";

const validateOptionalHttpUrl = (value: unknown): true | string => {
  if (value == null || value === "") return true;
  if (typeof value !== "string") return "Use a valid HTTP or HTTPS URL.";
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:"
      ? true
      : "Use a valid HTTP or HTTPS URL.";
  } catch {
    return "Use a valid HTTP or HTTPS URL.";
  }
};

export const EventLogistics: CollectionConfig = {
  slug: "event-logistics",
  labels: { singular: "Event logistics entry", plural: "Event logistics" },
  disableBulkEdit: true,
  hooks: notifyOnChangeHooks("event-logistics"),
  admin: {
    group: "Event",
    useAsTitle: "title",
    defaultColumns: ["title", "type", "venue", "dateTime", "active"],
    description: "Race-day arrival and bib expo information. Drag entries to control their public order.",
    ...adminPreview("/#event-logistics"),
  },
  access: { read: publicReadActive, create: editorOrAbove, update: editorOrAbove, delete: editorOrAbove },
  orderable: true,
  defaultSort: "_order",
  fields: [
    { name: "title", type: "text", required: true, maxLength: 100 },
    { name: "type", type: "select", required: true, options: [{ label: "Race day", value: "race-day" }, { label: "Bib expo", value: "bib-expo" }] },
    { name: "venue", type: "text", required: true, maxLength: 160 },
    { name: "address", type: "textarea", required: true, maxLength: 500 },
    { name: "dateTime", type: "date", required: true, admin: { date: { pickerAppearance: "dayAndTime", displayFormat: "dd MMM yyyy, h:mm a" } } },
    { name: "directions", label: "How runners should arrive", type: "textarea", required: true, maxLength: 1200 },
    { name: "mapUrl", label: "Map URL", type: "text", validate: validateOptionalHttpUrl, admin: { description: "Optional Google Maps or other HTTP/HTTPS directions link." } },
    { name: "active", type: "checkbox", required: true, defaultValue: true, index: true, admin: { position: "sidebar", description: "Only active entries appear publicly." } },
  ],
};
