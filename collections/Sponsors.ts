import type { CollectionConfig } from "payload";
import { editorOrAbove, publicReadActive } from "@/lib/access";
import { adminPreview } from "@/lib/admin-preview";
import { notifyOnChangeHooks } from "@/lib/realtime";

const validateOptionalURL = (value: unknown): true | string => {
  if (value == null || value === "") return true;
  if (typeof value !== "string") return "Enter a valid HTTP(S) URL";
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? true : "Only HTTP(S) URLs are allowed";
  } catch {
    return "Enter a valid HTTP(S) URL";
  }
};

export const Sponsors: CollectionConfig = {
  slug: "sponsors",
  labels: { singular: "Partner", plural: "Partners" },
  disableBulkEdit: true,
  hooks: notifyOnChangeHooks("sponsors"),
  admin: {
    useAsTitle: "name",
    group: "Event content",
    defaultColumns: ["name", "active", "_order"],
    description: "Publish only confirmed event and community partners. No partner is shown until its record is active.",
    ...adminPreview("/#partners"),
  },
  access: { read: publicReadActive, create: editorOrAbove, update: editorOrAbove, delete: editorOrAbove },
  orderable: true,
  defaultSort: "_order",
  fields: [
    { name: "name", type: "text", required: true, maxLength: 160 },
    { name: "logo", type: "relationship", relationTo: "media", required: true, admin: { description: "Select an active image with descriptive alt text." } },
    { name: "websiteUrl", type: "text", validate: validateOptionalURL },
    { name: "description", type: "textarea", maxLength: 500, admin: { description: "Optional factual description shown beneath the partner name." } },
    { name: "active", type: "checkbox", required: true, defaultValue: true, index: true, admin: { position: "sidebar", description: "Only active partners appear publicly." } },
  ],
};
