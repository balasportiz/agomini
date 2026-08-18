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
