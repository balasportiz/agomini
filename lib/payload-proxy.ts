const HOP_BY_HOP = new Set(["connection", "keep-alive", "proxy-authenticate", "proxy-authorization", "te", "trailers", "transfer-encoding", "upgrade", "content-encoding", "content-length", "host"])

const FORWARD_REQUEST_HEADERS = new Set(["accept", "authorization", "content-type", "cookie", "origin", "referer", "x-payload-csrf"])

/** Vercel Studio must not run Payload locally — proxy REST to Render instead. */
export function shouldProxyPayloadApi(): boolean {
  return Boolean(process.env.VERCEL && process.env.NEXT_PUBLIC_API_URL)
}

/** Host-only cookie so the browser stores it on agomonirun.com, not onrender.com. */
export function rewriteSetCookieForProxy(value: string): string {
  return value.replace(/;\s*domain=[^;]*/gi, "")
}

export function payloadCorsOrigins(...origins: Array<string | undefined>): string[] {
  const normalized = origins
    .map((value) => value?.replace(/\/$/, ""))
    .filter((value): value is string => Boolean(value))
  const extra: string[] = []
  for (const origin of normalized) {
    try {
      const url = new URL(origin)
      const hostname = url.hostname
      if (hostname === "localhost" || /^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname) || hostname.includes(":")) {
        continue
      }
      if (hostname.startsWith("www.")) {
        extra.push(`${url.protocol}//${hostname.slice(4)}`)
      } else {
        extra.push(`${url.protocol}//www.${hostname}`)
      }
    } catch {
      // Ignore values that are not absolute origins.
    }
  }
  return [...new Set([...normalized, ...extra])]
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
  const cookies = typeof upstream.headers.getSetCookie === "function" ? upstream.headers.getSetCookie() : []
  for (const cookie of cookies) {
    responseHeaders.append("set-cookie", rewriteSetCookieForProxy(cookie))
  }

  return new Response(upstream.body, { status: upstream.status, headers: responseHeaders })
}
