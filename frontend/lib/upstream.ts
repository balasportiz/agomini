import { getServerApiBase } from "@/lib/api-base";

const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
  "content-encoding",
  "content-length",
  "host",
]);

export async function proxyBackendRequest(request: Request, pathname: string): Promise<Response> {
  const base = getServerApiBase();
  const incoming = new URL(request.url);
  const upstreamUrl = `${base}${pathname}${incoming.search}`;
  const headers = new Headers();
  for (const [key, value] of request.headers.entries()) {
    const lower = key.toLowerCase();
    if (lower === "host" || lower === "content-length") continue;
    headers.set(key, value);
  }

  const method = request.method.toUpperCase();
  const init: RequestInit = { method, headers, cache: "no-store", redirect: "manual" };
  if (method !== "GET" && method !== "HEAD") {
    init.body = Buffer.from(await request.arrayBuffer());
  }

  const upstream = await fetch(upstreamUrl, init);
  const responseHeaders = new Headers();
  upstream.headers.forEach((value, key) => {
    if (HOP_BY_HOP.has(key.toLowerCase())) return;
    responseHeaders.set(key, value);
  });
  return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
}
