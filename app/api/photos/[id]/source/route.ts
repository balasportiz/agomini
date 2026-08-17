import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";
import config from "@payload-config";
import { getPayload } from "payload";
import { getServerEnv } from "@/lib/env";
import { resolveStoredFile } from "@/lib/storage";

export const dynamic = "force-dynamic";

const notFound = () => new Response("Not found", { status: 404 });

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const payload = await getPayload({ config });
    const document = await payload.findByID({ collection: "media", id, overrideAccess: false });
    const photo = document as unknown as Record<string, unknown>;
    if (photo.active === false || typeof photo.filename !== "string" || typeof photo.mimeType !== "string") return notFound();

    const filePath = resolveStoredFile(getServerEnv().STORAGE_ROOT, photo.filename);
    const fileStats = await stat(filePath);
    const etag = `"${id}-${String(photo.updatedAt ?? fileStats.mtimeMs)}-${fileStats.size}"`;
    if (request.headers.get("if-none-match") === etag) return new Response(null, { status: 304, headers: { ETag: etag } });

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
