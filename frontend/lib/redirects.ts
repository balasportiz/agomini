export function safeExternalDestination(
  value: string | null | undefined,
  siteUrl: string,
  internalPath: string,
): string | null {
  if (!value) return null;

  try {
    const destination = new URL(value);
    if (destination.protocol !== "http:" && destination.protocol !== "https:") return null;

    const site = new URL(siteUrl);
    if (destination.origin === site.origin && destination.pathname === internalPath) return null;

    return destination.toString();
  } catch {
    return null;
  }
}
