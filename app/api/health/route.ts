/**
 * /api/health
 *
 * On the VPS: checks Postgres connectivity via Payload.
 * On Vercel: proxies to the VPS health endpoint.
 */
export const dynamic = "force-dynamic";

function getApiBase(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "";
  return raw.replace(/\/$/, "");
}

export async function GET() {
  if (process.env.VERCEL) {
    const base = getApiBase();
    if (!base) return Response.json({ status: "ok" }, { headers: { "Cache-Control": "no-store" } });
    try {
      const upstream = await fetch(`${base}/api/health`, { cache: "no-store" });
      const data = await upstream.json();
      return Response.json(data, { status: upstream.status, headers: { "Cache-Control": "no-store" } });
    } catch {
      return Response.json({ status: "unavailable" }, { status: 503, headers: { "Cache-Control": "no-store" } });
    }
  }

  // VPS monolith path — dynamically import to avoid pulling pg into Vercel build.
  try {
    const { getPayload } = await import("payload");
    const { default: config } = await import("@payload-config");
    const payload = await getPayload({ config });
    await payload.count({ collection: "users" });
    return Response.json({ status: "ok" }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ status: "unavailable" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
