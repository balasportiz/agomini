const HOP_BY_HOP = new Set(["connection", "keep-alive", "proxy-authenticate", "proxy-authorization", "te", "trailers", "transfer-encoding", "upgrade", "content-encoding", "content-length", "host"])

const FORWARD_REQUEST_HEADERS = new Set(["accept", "authorization", "content-type", "cookie", "origin", "referer", "x-payload-csrf"])

/** Proxy Payload REST from the Vercel/local frontend to the Render backend. */
export function shouldProxyPayloadApi(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_API_URL);
}

/** Host-only cookie so the browser stores it on agomonirun.com, not onrender.com. */
export function rewriteSetCookieForProxy(value: string): string {
  return value.replace(/;\s*domain=[^;]*/gi, "")
}

function getSetCookieHeaders(headers: Headers): string[] {
  if (typeof headers.getSetCookie === "function") {
    return headers.getSetCookie()
  }
  const single = headers.get("set-cookie")
  return single ? [single] : []
}

export async function proxyPayloadRequest(request: Request): Promise<Response> {
  const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "")
  if (!base) {
    return Response.json({ errors: [{ message: "NEXT_PUBLIC_API_URL is not configured" }] }, { status: 503 })
  }

  const incoming = new URL(request.url)
  const upstreamUrl = `${base}${incoming.pathname}${incoming.search}`
  const headers = new Headers()
  for (const [key, value] of request.headers.entries()) {
    if (FORWARD_REQUEST_HEADERS.has(key.toLowerCase())) headers.set(key, value)
  }

  const method = request.method.toUpperCase()
  const init: RequestInit = { method, headers, cache: "no-store", redirect: "manual" }
  if (method !== "GET" && method !== "HEAD") {
    init.body = Buffer.from(await request.arrayBuffer())
  }

  const upstream = await fetch(upstreamUrl, init)
  const responseHeaders = new Headers()
  upstream.headers.forEach((value, key) => {
    if (HOP_BY_HOP.has(key.toLowerCase()) || key.toLowerCase() === "set-cookie") return
    responseHeaders.set(key, value)
  })
  const cookies = getSetCookieHeaders(upstream.headers)
  for (const cookie of cookies) {
    responseHeaders.append("set-cookie", rewriteSetCookieForProxy(cookie))
  }

  return new Response(upstream.body, { status: upstream.status, headers: responseHeaders })
}
