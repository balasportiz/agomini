import type { CollectionConfig } from "payload";
import { editorOrAbove, publicReadEdition } from "@/lib/access";
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

export const EventEditions: CollectionConfig = {
  slug: "event-editions",
  labels: { singular: "Event edition", plural: "Event editions" },
  disableBulkEdit: true,
  admin: {
    group: "Archives",
    useAsTitle: "name",
    defaultColumns: ["name", "editionLabel", "eventDate", "resultsPublished", "showInResults", "active"],
    description: "One reusable archive record per Agomoni Run edition. Gallery visibility and results-page visibility are independent.",
    ...adminPreview("/results"),
  },
  access: {
    create: editorOrAbove,
    delete: editorOrAbove,
    read: publicReadEdition,
    update: editorOrAbove,
  },
  defaultSort: "-eventDate",
  hooks: notifyOnChangeHooks("event-editions"),
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
      maxLength: 100,
      admin: { description: "Public name, for example Agomoni Run 1.0." },
    },
    {
      type: "row",
      fields: [
        {
          name: "editionLabel",
          label: "Edition label",
          type: "text",
          required: true,
          maxLength: 24,
          admin: { width: "40%", description: "Short label such as 1.0 or 2.0." },
        },
        {
          name: "slug",
          type: "text",
          required: true,
          unique: true,
          index: true,
          maxLength: 80,
          validate: (value: unknown) =>
            typeof value === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)
              ? true
              : "Use lowercase letters, numbers and hyphens only.",
          admin: { width: "60%", description: "Gallery URL, for example agomoni-run-1-0." },
        },
      ],
    },
    {
      name: "eventDate",
      type: "date",
      admin: {
        date: { pickerAppearance: "dayOnly", displayFormat: "dd MMM yyyy" },
        description: "Used to order newest and previous editions.",
      },
    },
    {
      name: "galleryDescription",
      type: "textarea",
      maxLength: 420,
      admin: { description: "Optional introduction shown above this edition's photographs." },
    },
    {
      name: "resultsUrl",
      label: "Official results link",
      type: "text",
      validate: validateOptionalHttpUrl,
      admin: { description: "The verified external timing/results page. Leave empty while results are pending." },
    },
    {
      type: "row",
      fields: [
        {
          name: "resultsPublished",
          label: "Results available",
          type: "checkbox",
          defaultValue: false,
          required: true,
          admin: { width: "50%", description: "Only enable after adding and checking the official results link." },
        },
        {
          name: "showInResults",
          label: "Show on results page",
          type: "checkbox",
          defaultValue: false,
          required: true,
          index: true,
          admin: { width: "50%", description: "Controls the public /results archive only. Gallery visibility is a separate switch." },
        },
      ],
    },
    {
      name: "active",
      label: "Show in gallery",
      type: "checkbox",
      defaultValue: false,
      required: true,
      index: true,
      admin: { description: "Controls the public gallery only. Does not hide or show this edition on the results page." },
    },
  ],
};
