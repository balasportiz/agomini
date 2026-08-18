import type { CollectionConfig } from "payload";
import { editorOrAbove, publicReadActive } from "@/lib/access";
import { adminPreview } from "@/lib/admin-preview";
import { notifyOnChangeHooks } from "@/lib/realtime";

export const FAQs: CollectionConfig = {
  slug: "faqs",
  labels: { singular: "FAQ", plural: "FAQs" },
  disableBulkEdit: true,
  hooks: notifyOnChangeHooks("faqs"),
  admin: {
    useAsTitle: "question",
    group: "Event content",
    defaultColumns: ["question", "active", "_order"],
    description: "Public answers shown in the homepage FAQ section. Drag rows in the list to set display order.",
    ...adminPreview("/#faq"),
  },
  access: { read: publicReadActive, create: editorOrAbove, update: editorOrAbove, delete: editorOrAbove },
  orderable: true,
  defaultSort: "_order",
  fields: [
    { name: "question", type: "text", required: true, maxLength: 240 },
    { name: "answer", type: "textarea", required: true, maxLength: 2_000 },
    { name: "active", type: "checkbox", required: true, defaultValue: true, index: true, admin: { position: "sidebar", description: "Only active answers appear publicly." } },
  ],
};
