import type { CollectionConfig } from "payload";
import { editorOrAbove, publicReadActive } from "@/lib/access";
import { adminPreview } from "@/lib/admin-preview";
import { notifyOnChangeHooks } from "@/lib/realtime";

export const RaceCategories: CollectionConfig = {
  slug: "race-categories",
  labels: { singular: "Race category", plural: "Race categories" },
  disableBulkEdit: true,
  hooks: notifyOnChangeHooks("race-categories"),
  admin: {
    group: "Event",
    useAsTitle: "name",
    defaultColumns: ["name", "distance", "fee", "active", "updatedAt"],
    description: "Distances, fees and race-day times shown in the Categories section. Keep unconfirmed details marked as pending.",
    ...adminPreview("/#categories"),
  },
  access: {
    create: editorOrAbove,
    delete: editorOrAbove,
    read: publicReadActive,
    update: editorOrAbove,
  },
  orderable: true,
  defaultSort: "_order",
  fields: [
    { name: "name", type: "text", required: true, maxLength: 40, admin: { description: "Short public label, for example 5K." } },
    { name: "distance", type: "text", required: true, maxLength: 30 },
    { name: "fee", type: "text", required: true, maxLength: 60, defaultValue: "To be announced" },
    { name: "reportingTime", type: "text", required: true, maxLength: 60, defaultValue: "To be announced" },
    { name: "startTime", type: "text", required: true, maxLength: 60, defaultValue: "To be announced" },
    { name: "description", type: "textarea", required: true, maxLength: 500 },
    { name: "ageEligibility", type: "text", maxLength: 120 },
    {
      name: "inclusions",
      type: "array",
      maxRows: 12,
      admin: { description: "Only list confirmed race-kit or participant inclusions." },
      fields: [{ name: "item", type: "text", required: true, maxLength: 100 }],
    },
    {
      name: "active",
      type: "checkbox",
      defaultValue: true,
      required: true,
      index: true,
      admin: { position: "sidebar", description: "Only active categories appear on the website." },
    },
  ],
};