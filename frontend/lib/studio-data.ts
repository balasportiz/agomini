/**
 * Studio data loaders — all reads go through the Payload REST API.
 *
 * On the VPS monolith these are same-origin requests (localhost:3000).
 * On Vercel these go to NEXT_PUBLIC_API_URL (the VPS).
 *
 * All requests include `credentials: "include"` / forward the auth cookie
 * so Payload's role-based access is enforced server-side.
 */
import { headers as nextHeaders } from "next/headers";
import { getServerApiBase } from "@/lib/api-base";
import { buildStudioImageUrl } from "@/lib/image-url";
import { payloadListQuery } from "@/lib/payload-query";

export type StudioMediaOption = {
  id: string;
  url: string;
  altText: string;
  filename: string;
  active: boolean;
};

function getApiBase(): string {
  return getServerApiBase();
}

async function apiGet<T>(path: string, cookieHeader?: string): Promise<T | null> {
  try {
    const url = `${getApiBase()}${path}`;
    const res = await fetch(url, {
      cache: "no-store",
      headers: cookieHeader ? { Cookie: cookieHeader } : {},
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function getCookieHeader(): Promise<string> {
  const h = await nextHeaders();
  return h.get("cookie") ?? "";
}

function toMediaOption(doc: Record<string, unknown>): StudioMediaOption | null {
  const id = doc.id;
  if (typeof id !== "string" && typeof id !== "number") return null;
  const key = String(id);
  const filename = typeof doc.filename === "string" ? doc.filename : key;
  return {
    id: key,
    url: buildStudioImageUrl(key),
    altText: typeof doc.altText === "string" ? doc.altText : "",
    filename,
    active: doc.active !== false,
  };
}

function relationshipId(value: unknown): string | null {
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (value && typeof value === "object" && "id" in value) {
    const id = (value as { id?: unknown }).id;
    if (typeof id === "string" || typeof id === "number") return String(id);
  }
  return null;
}

async function findGalleryMediaDocs(): Promise<Record<string, unknown>[]> {
  const cookie = await getCookieHeader();
  const result = await apiGet<{ docs: Record<string, unknown>[] }>(
    `/api/media?${payloadListQuery({ sort: "-createdAt", limit: 1000, depth: 0 })}`,
    cookie,
  );
  return result?.docs ?? [];
}

function toGalleryPhoto(doc: Record<string, unknown>): StudioGalleryPhoto | null {
  const base = toMediaOption(doc);
  if (!base) return null;
  return {
    ...base,
    caption: typeof doc.caption === "string" ? doc.caption : "",
    featured: doc.featured === true,
    showInGallery: doc.showInGallery === true,
    galleryEditionId: relationshipId(doc.galleryEdition),
    assetType: typeof doc.assetType === "string" ? doc.assetType : "site",
    updatedAt: typeof doc.updatedAt === "string" ? doc.updatedAt : "",
  };
}

/** Media items available to pick as hero/story/highlight/partner images. */
export async function loadMediaOptions(): Promise<StudioMediaOption[]> {
  const cookie = await getCookieHeader();
  const result = await apiGet<{ docs: Record<string, unknown>[] }>(
    "/api/media?sort=-updatedAt&limit=200",
    cookie,
  );
  return (result?.docs ?? [])
    .map(toMediaOption)
    .filter((o): o is StudioMediaOption => o !== null);
}

/** Full media library for the gallery manager (includes inactive). */
export async function loadMediaLibrary(): Promise<
  (StudioMediaOption & { caption: string; featured: boolean; updatedAt: string })[]
> {
  const cookie = await getCookieHeader();
  const result = await apiGet<{ docs: Record<string, unknown>[] }>(
    "/api/media?sort=_order&limit=500",
    cookie,
  );
  return (result?.docs ?? [])
    .map((doc) => {
      const base = toMediaOption(doc);
      if (!base) return null;
      return {
        ...base,
        caption: typeof doc.caption === "string" ? doc.caption : "",
        featured: doc.featured === true,
        updatedAt: typeof doc.updatedAt === "string" ? doc.updatedAt : "",
      };
    })
    .filter(
      (o): o is StudioMediaOption & { caption: string; featured: boolean; updatedAt: string } =>
        o !== null,
    );
}

/** Current Site Settings global as a plain object for the editor form. */
export async function loadSiteSettings(): Promise<Record<string, unknown>> {
  const cookie = await getCookieHeader();
  const result = await apiGet<Record<string, unknown>>("/api/globals/site-settings?depth=0", cookie);
  return result ?? {};
}

/** Current Navigation global (header/footer link arrays). */
export async function loadNavigation(): Promise<{
  headerLinks: { label: string; href: string }[];
  footerLinks: { label: string; href: string }[];
}> {
  const cookie = await getCookieHeader();
  const nav = await apiGet<Record<string, unknown>>("/api/globals/navigation?depth=0", cookie);
  const toLinks = (value: unknown) =>
    Array.isArray(value)
      ? (value as Record<string, unknown>[]).map((item) => ({
          label: String(item.label ?? ""),
          href: String(item.href ?? ""),
        }))
      : [];
  return {
    headerLinks: toLinks(nav?.headerLinks),
    footerLinks: toLinks(nav?.footerLinks),
  };
}

export type StudioAccount = { id: string; email: string; name: string; role: string };

/** All admin-panel accounts, for the Accounts manager (super admin only). */
export async function loadAccounts(): Promise<StudioAccount[]> {
  const cookie = await getCookieHeader();
  const result = await apiGet<{ docs: Record<string, unknown>[] }>(
    "/api/users?sort=-createdAt&limit=200",
    cookie,
  );
  return (result?.docs ?? []).map((doc) => ({
    id: String(doc.id ?? ""),
    email: typeof doc.email === "string" ? doc.email : "",
    name: typeof doc.name === "string" ? doc.name : "",
    role: typeof doc.role === "string" ? doc.role : "editor",
  }));
}

/** Generic loader for a content collection's documents as plain rows. */
export async function loadCollectionRows(collection: string): Promise<Record<string, unknown>[]> {
  const cookie = await getCookieHeader();
  const result = await apiGet<{ docs: Record<string, unknown>[] }>(
    `/api/${encodeURIComponent(collection)}?sort=_order&limit=200`,
    cookie,
  );
  return result?.docs ?? [];
}

export type StudioEdition = {
  id: string;
  name: string;
  editionLabel: string;
  slug: string;
  eventDate: string;
  galleryDescription: string;
  resultsUrl: string;
  resultsPublished: boolean;
  active: boolean;
};

export type StudioGalleryPhoto = StudioMediaOption & {
  caption: string;
  featured: boolean;
  showInGallery: boolean;
  galleryEditionId: string | null;
  assetType: string;
  updatedAt: string;
};

/** Every edition, including drafts, used by the dedicated Results and Galleries workspaces. */
export async function loadEventEditions(): Promise<StudioEdition[]> {
  const cookie = await getCookieHeader();
  const result = await apiGet<{ docs: Record<string, unknown>[] }>(
    "/api/event-editions?sort=-eventDate&limit=100",
    cookie,
  );
  return (result?.docs ?? []).map((doc) => ({
    id: String(doc.id ?? ""),
    name: String(doc.name ?? ""),
    editionLabel: String(doc.editionLabel ?? ""),
    slug: String(doc.slug ?? ""),
    eventDate: typeof doc.eventDate === "string" ? doc.eventDate : "",
    galleryDescription: typeof doc.galleryDescription === "string" ? doc.galleryDescription : "",
    resultsUrl: typeof doc.resultsUrl === "string" ? doc.resultsUrl : "",
    resultsPublished: doc.resultsPublished === true,
    active: doc.active !== false,
  }));
}

/** Event-gallery assets only; site/story images and partner logos stay outside this workspace. */
export async function loadGalleryMedia(): Promise<StudioGalleryPhoto[]> {
  const docs = await findGalleryMediaDocs();
  return docs.map(toGalleryPhoto).filter((photo): photo is StudioGalleryPhoto => photo !== null);
}

/** Edition explicitly selected for the homepage gallery preview. */
export async function loadFeaturedGalleryEditionId(): Promise<string | null> {
  const cookie = await getCookieHeader();
  const settings = await apiGet<Record<string, unknown>>(
    "/api/globals/site-settings?depth=0",
    cookie,
  );
  return settings ? relationshipId(settings.featuredGalleryEdition) : null;
}
