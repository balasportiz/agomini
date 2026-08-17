/**
 * /api/photos/[id]/source
 *
 * Resolves a media record ID to its raw photo file.
 *
 * Storage modes:
 *  - R2 active:     302 redirect to the R2 public URL (browser/imgproxy fetches from CF edge)
 *  - Local disk:    streams the file from STORAGE_ROOT
 *
 * On Vercel: proxies the redirect/stream to the VPS (same semantics, just
 * one extra hop — imgproxy on the VPS follows the redirect transparently).
 */
export const dynamic = "force-dynamic";

function getApiBase(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "";
  return raw.replace(/\/$/, "");
}

const notFound = () => new Response("Not found", { status: 404 });

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  // ── Vercel: proxy to VPS ────────────────────────────────────────────────
  if (process.env.VERCEL) {
    const base = getApiBase();
    if (!base) return notFound();
    try {
      const upstreamUrl = `${base}/api/photos/${encodeURIComponent(id)}/source`;
      const upstream = await fetch(upstreamUrl, {
        redirect: "manual", // forward redirects as-is to the browser
        headers: { "if-none-match": request.headers.get("if-none-match") ?? "" },
      });
      if (upstream.status === 302 || upstream.status === 301) {
        // R2 redirect: pass it straight to the browser
        return new Response(null, {
          status: 302,
          headers: { Location: upstream.headers.get("Location") ?? upstreamUrl },
        });
      }
      if (!upstream.ok) return notFound();
      return new Response(upstream.body, {
        status: upstream.status,
        headers: {
          "Cache-Control": upstream.headers.get("Cache-Control") ?? "public, max-age=3600",
          "Content-Type": upstream.headers.get("Content-Type") ?? "application/octet-stream",
          ETag: upstream.headers.get("ETag") ?? "",
          "X-Content-Type-Options": "nosniff",
        },
      });
    } catch {
      return notFound();
    }
  }

  // ── VPS monolith ─────────────────────────────────────────────────────────
  try {
    const { getPayload } = await import("payload");
    const { default: config } = await import("@payload-config");
    const { getServerEnv } = await import("@/lib/env");
    const { isR2Active, r2PublicUrl } = await import("@/lib/storage");

    const payload = await getPayload({ config });
    const document = await payload.findByID({ collection: "media", id, overrideAccess: false });
    const photo = document as unknown as Record<string, unknown>;

    if (
      photo.active === false ||
      typeof photo.filename !== "string" ||
      typeof photo.mimeType !== "string"
    )
      return notFound();

    const filename = photo.filename;

    // ── R2 mode: 302 redirect to public R2 URL ──────────────────────────
    if (isR2Active()) {
      const publicUrl = r2PublicUrl(filename);
      return new Response(null, {
        status: 302,
        headers: {
          Location: publicUrl,
          "Cache-Control": "public, max-age=3600",
        },
      });
    }

    // ── Local disk mode: stream the file ───────────────────────────────
    const { streamFile } = await import("@/lib/storage");
    const env = getServerEnv();
    const { stream, size } = await streamFile(filename, env.STORAGE_ROOT);

    const updatedAt = String(photo.updatedAt ?? "");
    const etag = `"${id}-${updatedAt}-${size}"`;
    if (request.headers.get("if-none-match") === etag)
      return new Response(null, { status: 304, headers: { ETag: etag } });

    return new Response(stream, {
      headers: {
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
        "Content-Length": String(size),
        "Content-Type": photo.mimeType as string,
        ETag: etag,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return notFound();
  }
}
