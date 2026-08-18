import type { CollectionConfig } from "payload";
import { editorOrAbove, publicReadActive } from "@/lib/access";
import { adminPreview } from "@/lib/admin-preview";
import { notifyOnChangeHooks } from "@/lib/realtime";

export const Highlights: CollectionConfig = {
  slug: "highlights",
  disableBulkEdit: true,
  hooks: notifyOnChangeHooks("highlights"),
  admin: {
    useAsTitle: "title",
    group: "Event content",
    defaultColumns: ["title", "active", "_order"],
    description: "Confirmed event support and key race-day information shown on the homepage.",
    ...adminPreview("/#highlights"),
  },
  access: { read: publicReadActive, create: editorOrAbove, update: editorOrAbove, delete: editorOrAbove },
  orderable: true,
  defaultSort: "_order",
  fields: [
    { name: "title", type: "text", required: true, maxLength: 120 },
    { name: "description", type: "textarea", required: true, maxLength: 800 },
    { name: "photo", type: "relationship", relationTo: "media", admin: { description: "Optional active gallery photo associated with this highlight." } },
    { name: "active", type: "checkbox", required: true, defaultValue: true, index: true, admin: { position: "sidebar", description: "Only active highlights appear publicly." } },
  ],
};
