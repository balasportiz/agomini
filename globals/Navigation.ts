import type { GlobalConfig } from "payload";
import { editorOrAboveGlobal, publicGlobalRead } from "@/lib/access";
import { adminPreview } from "@/lib/admin-preview";
import { defaultFooterLinks, defaultHeaderLinks } from "@/lib/default-content";
import { notifyContentChanged } from "@/lib/realtime";

const validateLinkDestination = (value: unknown): true | string => {
  if (typeof value !== "string" || !value.trim()) return "Enter a destination.";
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:"
      ? true
      : "Use an internal path (e.g. /#about) or an HTTP/HTTPS URL.";
  } catch {
    return "Use an internal path (e.g. /#about) or an HTTP/HTTPS URL.";
  }
};

const linkFields = [
  { name: "label", type: "text" as const, required: true, maxLength: 40 },
  {
    name: "href",
    label: "Destination",
    type: "text" as const,
    required: true,
    validate: validateLinkDestination,
    admin: { description: "An internal path like /#about or /gallery, or a full https:// URL." },
  },
];

export const Navigation: GlobalConfig = {
  slug: "navigation",
  label: "Navigation",
  admin: {
    group: "Event",
    description: "Header menu, mobile menu and footer links shown on every page. Drag rows to reorder.",
    ...adminPreview("/"),
  },
  access: {
    read: publicGlobalRead,
    update: editorOrAboveGlobal,
  },
  hooks: {
    afterChange: [() => notifyContentChanged("navigation")],
  },
  fields: [
    {
      name: "headerLinks",
      label: "Header & mobile menu links",
      type: "array",
      minRows: 1,
      maxRows: 12,
      defaultValue: defaultHeaderLinks,
      admin: { description: "Shown in the floating header on desktop and in the mobile menu." },
      fields: linkFields,
    },
    {
      name: "footerLinks",
      label: "Footer \u201cExplore\u201d links",
      type: "array",
      minRows: 1,
      maxRows: 12,
      defaultValue: defaultFooterLinks,
      admin: { description: "Shown in the footer's Explore column." },
      fields: linkFields,
    },
  ],
  versions: { drafts: false },
};
