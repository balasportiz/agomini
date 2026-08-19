import { loadPublicSiteData } from "@/lib/site-data";
import { buildLlmsTxt } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function GET() {
  const { settings, editions } = await loadPublicSiteData();
  return new Response(buildLlmsTxt(settings, editions), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
}
