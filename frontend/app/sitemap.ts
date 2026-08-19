import type { MetadataRoute } from "next";
import { loadPublicSiteData } from "@/lib/site-data";
import { absoluteUrl } from "@/lib/seo";
import { notifyIndexNow } from "@/lib/indexnow";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();
  const pages: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), lastModified, changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/gallery"), lastModified, changeFrequency: "weekly", priority: 0.9 },
    { url: absoluteUrl("/register"), lastModified, changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl("/results"), lastModified, changeFrequency: "weekly", priority: 0.7 },
    { url: absoluteUrl("/llms.txt"), lastModified, changeFrequency: "weekly", priority: 0.4 },
  ];
  try {
    const { editions } = await loadPublicSiteData();
    pages.push(
      ...editions.map((edition) => ({
        url: absoluteUrl(`/gallery/${edition.slug}`),
        lastModified,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      })),
    );
  } catch {
    // Still return the core sitemap so Google can fetch it if the API is down.
  }
  await notifyIndexNow(pages.map((page) => page.url));
  return pages;
}
