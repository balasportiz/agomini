/**
 * /api/photos/[id]/source
 *
 * On the VPS: streams the raw photo file from local disk.
 * On Vercel: proxies to the VPS (imgproxy uses this as its source URL;
 * Vercel-deployed pages never call this route directly).
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

  if (process.env.VERCEL) {
    const base = getApiBase();
    if (!base) return notFound();
    try {
      const url = `${base}/api/photos/${encodeURIComponent(id)}/source`;
      const upstream = await fetch(url, {
        headers: { "if-none-match": request.headers.get("if-none-match") ?? "" },
      });
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

  // VPS monolith path — dynamically import filesystem and Payload modules.
  try {
    const { createReadStream } = await import("node:fs");
    const { stat } = await import("node:fs/promises");
    const { Readable } = await import("node:stream");
    const { getPayload } = await import("payload");
    const { default: config } = await import("@payload-config");
    const { getServerEnv } = await import("@/lib/env");
    const { resolveStoredFile } = await import("@/lib/storage");

    const payload = await getPayload({ config });
    const document = await payload.findByID({ collection: "media", id, overrideAccess: false });
    const photo = document as unknown as Record<string, unknown>;
    if (
      photo.active === false ||
      typeof photo.filename !== "string" ||
      typeof photo.mimeType !== "string"
    )
      return notFound();

    const filePath = resolveStoredFile(getServerEnv().STORAGE_ROOT, photo.filename);
    const fileStats = await stat(filePath);
    const etag = `"${id}-${String(photo.updatedAt ?? fileStats.mtimeMs)}-${fileStats.size}"`;
    if (request.headers.get("if-none-match") === etag)
      return new Response(null, { status: 304, headers: { ETag: etag } });

    const body = Readable.toWeb(createReadStream(filePath)) as ReadableStream;
    return new Response(body, {
      headers: {
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
        "Content-Length": String(fileStats.size),
        "Content-Type": photo.mimeType,
        ETag: etag,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return notFound();
  }
}
