import dns from "node:dns";

/**
 * Render (and many PaaS hosts) have no outbound IPv6. Supabase Direct Connection
 * hostnames (`db.<ref>.supabase.co`) often resolve to AAAA-only records, which
 * then fail with `ENETUNREACH`. Prefer IPv4 so dual-stack hosts work; callers
 * still need the Session pooler URL when the host is IPv6-only.
 */
export function lookupIPv4(
  hostname: string,
  options: dns.LookupOneOptions,
  callback: (err: NodeJS.ErrnoException | null, address: string, family: number) => void,
): void {
  dns.lookup(hostname, { ...options, family: 4, all: false }, callback);
}

export function isLocalPostgresHost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1" || hostname === "postgres";
}

export function isSupabaseDirectConnection(connectionString: string): boolean {
  try {
    const { hostname, port } = new URL(connectionString);
    const usesDefaultPostgresPort = port === "" || port === "5432";
    return hostname.startsWith("db.") && hostname.endsWith(".supabase.co") && usesDefaultPostgresPort;
  } catch {
    return false;
  }
}

/**
 * node-pg 8.16+ treats sslmode=require as verify-full, which rejects Supabase's
 * pooler chain (`self-signed certificate in certificate chain`). Restore libpq
 * `require` semantics for remote hosts and skip TLS entirely for local Docker.
 */
export function withManagedPostgresSsl(connectionString: string): string {
  const url = new URL(connectionString);
  if (isLocalPostgresHost(url.hostname)) return connectionString;
  if (!url.searchParams.has("sslmode")) url.searchParams.set("sslmode", "require");
  url.searchParams.set("uselibpqcompat", "true");
  return url.toString();
}

export function getPostgresPoolConfig(connectionString: string) {
  if (process.env.RENDER && process.env.NEXT_PHASE !== "phase-production-build" && isSupabaseDirectConnection(connectionString)) {
    throw new Error(
      "DATABASE_URL uses Supabase Direct Connection (db.*.supabase.co:5432), which is IPv6-only. Render cannot reach IPv6. In Supabase: Connect → Session pooler, copy the URI (host aws-0-<region>.pooler.supabase.com), add ?sslmode=require, and set that as DATABASE_URL.",
    );
  }

  const hostname = new URL(connectionString).hostname;
  const remote = !isLocalPostgresHost(hostname);

  return {
    connectionString: withManagedPostgresSsl(connectionString),
    lookup: lookupIPv4,
    ...(remote ? { ssl: { rejectUnauthorized: false } } : {}),
  };
}
