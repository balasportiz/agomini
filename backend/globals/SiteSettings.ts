import type { GlobalConfig } from "payload";
import { editorOrAboveGlobal, publicGlobalRead } from "@/lib/access";
import { adminPreview } from "@/lib/admin-preview";
import { defaultSiteSettings } from "@/lib/default-content";
import { notifyContentChanged } from "@/lib/realtime";

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

const validateOptionalLink = (value: unknown): true | string => {
  if (value == null || value === "") return true;
  if (typeof value !== "string") return "Use an internal path or HTTP/HTTPS URL.";
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  return validateOptionalHttpUrl(value) === true
    ? true
    : "Use an internal path or HTTP/HTTPS URL.";
};

export const SiteSettings: GlobalConfig = {
  slug: "site-settings",
  label: "Site settings",
  admin: {
    group: "Event",
    description: "The website’s event identity, primary story, registration state, gallery introduction and contact details.",
    ...adminPreview("/"),
  },
  access: {
    read: publicGlobalRead,
    update: editorOrAboveGlobal,
  },
  hooks: {
    afterChange: [() => notifyContentChanged("site-settings")],
  },
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          label: "Event",
          description: "Core facts reused across the homepage, footer and status pages.",
          fields: [
            { name: "eventName", type: "text", required: true, defaultValue: defaultSiteSettings.eventName },
            { name: "tagline", type: "text", required: true, defaultValue: defaultSiteSettings.tagline },
            {
              name: "eventDateTime",
              type: "date",
              required: true,
              defaultValue: defaultSiteSettings.eventDateTime,
              admin: {
                date: { pickerAppearance: "dayAndTime", displayFormat: "dd MMM yyyy, h:mm a" },
                description: "Keep Timing confirmed off until the official flag-off time is approved.",
              },
            },
            { name: "timingConfirmed", type: "checkbox", defaultValue: defaultSiteSettings.timingConfirmed, admin: { description: "Controls whether the website presents the time as confirmed." } },
            { name: "timezone", type: "text", required: true, defaultValue: defaultSiteSettings.timezone, admin: { description: "IANA timezone used to format the event date, normally Asia/Kolkata." } },
            { name: "venue", type: "text", required: true, defaultValue: defaultSiteSettings.venue },
            { name: "organiserName", type: "text", required: true, defaultValue: defaultSiteSettings.organiserName },
            { name: "organiserDescription", type: "textarea", required: true, defaultValue: defaultSiteSettings.organiserDescription },
            {
              name: "logisticsHeading",
              label: "Event day heading",
              type: "text",
              required: true,
              defaultValue: defaultSiteSettings.logisticsHeading,
              admin: { description: "Large heading above the arrival and bib-collection entries on the homepage." },
            },
            {
              name: "logisticsSubheading",
              label: "Event day sub-heading",
              type: "textarea",
              required: true,
              defaultValue: defaultSiteSettings.logisticsSubheading,
              admin: { description: "One line shown beside the event day heading." },
            },
          ],
        },
        {
          label: "Hero & actions",
          description: "Opening message and the destinations used by every registration and results button.",
          fields: [
            { name: "heroHeading", type: "text", required: true, defaultValue: defaultSiteSettings.heroHeading },
            { name: "heroSubheading", type: "textarea", required: true, defaultValue: defaultSiteSettings.heroSubheading },
            { name: "heroPhoto", type: "relationship", relationTo: "media", admin: { description: "Choose an active landscape image with meaningful alt text." } },
            { name: "registrationUrl", type: "text", validate: validateOptionalHttpUrl, admin: { description: "Leave empty until the official registration destination is ready." } },
            { name: "resultsUrl", type: "text", validate: validateOptionalHttpUrl, admin: { description: "Leave empty until official timing results are available." } },
            {
              name: "registrationStatus",
              type: "select",
              required: true,
              defaultValue: defaultSiteSettings.registrationStatus,
              admin: { description: "Controls the wording and state of registration information." },
              options: [
                { label: "Opening soon", value: "soon" },
                { label: "Open", value: "open" },
                { label: "Closed", value: "closed" },
                { label: "Race completed", value: "completed" },
              ],
            },
            {
              type: "row",
              fields: [
                {
                  name: "showRegistrationCta",
                  label: "Show registration buttons",
                  type: "checkbox",
                  required: true,
                  defaultValue: defaultSiteSettings.showRegistrationCta,
                  admin: { width: "50%", description: "Show Register and Join the run actions across the website." },
                },
                {
                  name: "showResultsCta",
                  label: "Show results buttons",
                  type: "checkbox",
                  required: true,
                  defaultValue: defaultSiteSettings.showResultsCta,
                  admin: { width: "50%", description: "Show Results actions when verified results are ready." },
                },
              ],
            },
            {
              name: "heroManifesto",
              type: "group",
              label: "Hero manifesto overlay",
              admin: { description: "The small overlay text and route-line strip layered over the hero image." },
              fields: [
                { name: "bengaliWord", label: "Bengali word", type: "text", maxLength: 20, defaultValue: defaultSiteSettings.heroManifesto.bengaliWord },
                {
                  type: "row",
                  fields: [
                    { name: "line1", label: "Line 1", type: "text", maxLength: 60, defaultValue: defaultSiteSettings.heroManifesto.line1, admin: { width: "50%" } },
                    { name: "line2", label: "Line 2", type: "text", maxLength: 60, defaultValue: defaultSiteSettings.heroManifesto.line2, admin: { width: "50%" } },
                  ],
                },
                {
                  type: "row",
                  fields: [
                    { name: "wordmarkTop", label: "Wordmark top", type: "text", maxLength: 20, defaultValue: defaultSiteSettings.heroManifesto.wordmarkTop, admin: { width: "33%" } },
                    { name: "wordmarkBottom", label: "Wordmark bottom", type: "text", maxLength: 20, defaultValue: defaultSiteSettings.heroManifesto.wordmarkBottom, admin: { width: "33%" } },
                    { name: "wordmarkYear", label: "Wordmark year", type: "text", maxLength: 10, defaultValue: defaultSiteSettings.heroManifesto.wordmarkYear, admin: { width: "34%" } },
                  ],
                },
                {
                  type: "row",
                  fields: [
                    { name: "routeLineStart", label: "Route line start", type: "text", maxLength: 30, defaultValue: defaultSiteSettings.heroManifesto.routeLineStart, admin: { width: "50%" } },
                    { name: "routeLineEnd", label: "Route line end", type: "text", maxLength: 30, defaultValue: defaultSiteSettings.heroManifesto.routeLineEnd, admin: { width: "50%", description: "For example a date, distance or tagline shown after the route dot." } },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: "Story",
          description: "The homepage story chapters: the event introduction plus the two immersive image sections.",
          fields: [
            { name: "aboutBengaliWord", label: "About: Bengali word", type: "text", maxLength: 20, defaultValue: defaultSiteSettings.aboutBengaliWord },
            { name: "aboutHeading", label: "About: heading", type: "text", maxLength: 80, defaultValue: defaultSiteSettings.aboutHeading },
            { name: "about", label: "About: body copy", type: "textarea", required: true, defaultValue: defaultSiteSettings.about, admin: { description: "Describe the confirmed purpose of the run without unsupported claims." } },
            {
              name: "storyChapter",
              type: "group",
              label: "Immersive chapter: \u201cTogether\u201d",
              admin: { description: "The first full-bleed image section, shown right after the About copy." },
              fields: [
                { name: "image", type: "relationship", relationTo: "media", admin: { description: "Optional. Falls back to a stock photo when empty." } },
                { name: "imageAlt", label: "Image alt text", type: "text", maxLength: 200, defaultValue: defaultSiteSettings.storyChapter.imageAlt },
                { name: "word", label: "Overlay word", type: "text", maxLength: 20, defaultValue: defaultSiteSettings.storyChapter.word },
                { name: "lead", label: "Lead line", type: "text", maxLength: 80, defaultValue: defaultSiteSettings.storyChapter.lead },
                { name: "heading", label: "Heading", type: "textarea", maxLength: 200, defaultValue: defaultSiteSettings.storyChapter.heading },
              ],
            },
            {
              name: "communityChapter",
              type: "group",
              label: "Immersive chapter: community",
              admin: { description: "The second image section, alongside the \u201cJoin the run\u201d call to action." },
              fields: [
                { name: "image", type: "relationship", relationTo: "media", admin: { description: "Optional. Falls back to a stock photo when empty." } },
                { name: "imageAlt", label: "Image alt text", type: "text", maxLength: 200, defaultValue: defaultSiteSettings.communityChapter.imageAlt },
                { name: "tag", label: "Overlay tag", type: "text", maxLength: 60, defaultValue: defaultSiteSettings.communityChapter.tag },
                { name: "heading", label: "Heading", type: "text", maxLength: 100, defaultValue: defaultSiteSettings.communityChapter.heading },
                { name: "body", label: "Body copy", type: "textarea", maxLength: 400, defaultValue: defaultSiteSettings.communityChapter.body },
                { name: "ctaLabel", label: "Call-to-action label", type: "text", maxLength: 40, defaultValue: defaultSiteSettings.communityChapter.ctaLabel },
              ],
            },
          ],
        },
        {
          label: "Contact & gallery",
          description: "Optional public contact channels, site announcement and previous-edition gallery copy.",
          fields: [
            {
              name: "announcement",
              type: "group",
              admin: { description: "A short notice displayed above the homepage header when enabled." },
              fields: [
                { name: "enabled", type: "checkbox", defaultValue: defaultSiteSettings.announcement.enabled },
                { name: "text", type: "text", maxLength: 180 },
                { name: "linkLabel", type: "text", maxLength: 50 },
                { name: "linkUrl", type: "text", validate: validateOptionalLink },
              ],
            },
            { name: "contactEmail", type: "email" },
            { name: "primaryPhone", type: "text", maxLength: 30 },
            { name: "secondaryPhone", type: "text", maxLength: 30 },
            { name: "instagramUrl", type: "text", validate: validateOptionalHttpUrl },
            { name: "facebookUrl", type: "text", validate: validateOptionalHttpUrl },
            { name: "youtubeUrl", type: "text", validate: validateOptionalHttpUrl },
            { name: "galleryTitle", type: "text", required: true, defaultValue: defaultSiteSettings.galleryTitle },
            { name: "galleryDescription", type: "textarea", required: true, defaultValue: defaultSiteSettings.galleryDescription },
            {
              name: "featuredGalleryEdition",
              label: "Homepage gallery edition",
              type: "relationship",
              relationTo: "event-editions",
              admin: { description: "The edition previewed on the homepage. When empty, the newest public edition with photos is used." },
            },
          ],
        },
      ],
    },
  ],
  versions: { drafts: false },
};