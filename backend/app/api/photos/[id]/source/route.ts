/**
 * /api/photos/[id]/source — streams a media record from R2 or local disk.
 */
export const dynamic = "force-dynamic";

const notFound = () => new Response("Not found", { status: 404 });

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const { getPayload } = await import("payload");
    const { default: config } = await import("@payload-config");
    const { getServerEnv } = await import("@/lib/env");
    const { streamFile } = await import("@/lib/storage");
    const env = getServerEnv();

    const payload = await getPayload({ config });
    const { user } = await payload.auth({ headers: request.headers });
    const document = await payload.findByID({
      collection: "media",
      id,
      overrideAccess: false,
      user: user ?? undefined,
    });
    const photo = document as unknown as Record<string, unknown>;

    if (typeof photo.filename !== "string" || typeof photo.mimeType !== "string") return notFound();
    if (!user && photo.active === false) return notFound();

    const { stream, size, mimeType } = await streamFile(photo.filename, env.STORAGE_ROOT);

    const updatedAt = String(photo.updatedAt ?? "");
    const etag = `"${id}-${updatedAt}-${size}"`;
    if (request.headers.get("if-none-match") === etag)
      return new Response(null, { status: 304, headers: { ETag: etag } });

    const headers = new Headers({
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      "Content-Type": mimeType || (photo.mimeType as string),
      ETag: etag,
      "X-Content-Type-Options": "nosniff",
    });
    if (size > 0) headers.set("Content-Length", String(size));
    return new Response(stream, { headers });
  } catch (error) {
    console.error("[photos/source] failed", id, error);
    return notFound();
  }
}
