import { absoluteUrl, publicSiteUrl } from "@/lib/seo";

const INDEXNOW_KEY = "7e2b74c5e82bacd0639e29a5e1817a0f";

export async function notifyIndexNow(paths: string[]): Promise<void> {
  const host = new URL(publicSiteUrl()).host;
  const urlList = [...new Set(paths.map((path) => (path.startsWith("http") ? path : absoluteUrl(path))))];
  try {
    await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host,
        key: INDEXNOW_KEY,
        keyLocation: absoluteUrl(`/${INDEXNOW_KEY}.txt`),
        urlList,
      }),
    });
  } catch {
    // Indexing pings must never break the public sitemap.
  }
}
