import type { GeneratePreviewURL, LivePreviewConfig } from "payload";

const breakpoints: NonNullable<LivePreviewConfig["breakpoints"]> = [
  { name: "mobile", label: "Mobile", width: 390, height: 844 },
  { name: "tablet", label: "Tablet", width: 820, height: 1180 },
  { name: "desktop", label: "Desktop", width: 1440, height: 900 },
];

const resolveURL = (path: string, origin: string) => new URL(path, origin).toString();

export function adminPreview(path: string): {
  preview: GeneratePreviewURL;
  livePreview: LivePreviewConfig;
} {
  return {
    preview: (_document, { req }) => resolveURL(path, req.payload.config.serverURL),
    livePreview: {
      breakpoints,
      openByDefault: false,
      url: ({ req }) => resolveURL(path, req.payload.config.serverURL),
    },
  };
}