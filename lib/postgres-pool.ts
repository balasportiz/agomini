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

export function isSupabaseDirectConnection(connectionString: string): boolean {
  try {
    const { hostname, port } = new URL(connectionString);
    const usesDefaultPostgresPort = port === "" || port === "5432";
    return hostname.startsWith("db.") && hostname.endsWith(".supabase.co") && usesDefaultPostgresPort;
  } catch {
    return false;
  }
}

export function getPostgresPoolConfig(connectionString: string) {
  if (process.env.RENDER && process.env.NEXT_PHASE !== "phase-production-build" && isSupabaseDirectConnection(connectionString)) {
    throw new Error(
      "DATABASE_URL uses Supabase Direct Connection (db.*.supabase.co:5432), which is IPv6-only. Render cannot reach IPv6. In Supabase: Connect → Session pooler, copy the URI (host aws-0-<region>.pooler.supabase.com, port 6543), add ?sslmode=require, and set that as DATABASE_URL.",
    );
  }

  return {
    connectionString,
    lookup: lookupIPv4,
  };
}
