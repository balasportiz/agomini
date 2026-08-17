import { getPayload } from "payload";
import config from "@payload-config";

export type StudioMediaOption = {
  id: string;
  url: string;
  altText: string;
  filename: string;
  active: boolean;
};

function toMediaOption(doc: Record<string, unknown>): StudioMediaOption | null {
  const id = doc.id;
  if (typeof id !== "string" && typeof id !== "number") return null;
  const key = String(id);
  const filename = typeof doc.filename === "string" ? doc.filename : key;
  return {
    id: key,
    // Studio must preview inactive uploads before they can be published. The
    // public imgproxy source intentionally rejects inactive media, so use
    // Payload's same-origin media-file endpoint here; browser auth and the
    // unguessable stored filename keep this an editor-only workflow.
    url: `/api/media/file/${encodeURIComponent(filename)}`,
    altText: typeof doc.altText === "string" ? doc.altText : "",
    filename,
    active: doc.active !== false,
  };
}

/** Media items available to pick as hero/story/highlight/partner images. */
export async function loadMediaOptions(): Promise<StudioMediaOption[]> {
  try {
    const payload = await getPayload({ config });
    const result = await payload.find({ collection: "media", overrideAccess: true, sort: "-updatedAt", limit: 200 });
    return result.docs
      .map((doc) => toMediaOption(doc as unknown as Record<string, unknown>))
      .filter((o): o is StudioMediaOption => o !== null);
  } catch {
    return [];
  }
}

/** Full media library for the gallery manager (includes inactive). */
export async function loadMediaLibrary(): Promise<(StudioMediaOption & { caption: string; featured: boolean; updatedAt: string })[]> {
  try {
    const payload = await getPayload({ config });
    const result = await payload.find({ collection: "media", overrideAccess: true, sort: "_order", limit: 500 });
    return result.docs
      .map((doc) => {
        const base = toMediaOption(doc as unknown as Record<string, unknown>);
        if (!base) return null;
        const record = doc as unknown as Record<string, unknown>;
        return {
          ...base,
          caption: typeof record.caption === "string" ? record.caption : "",
          featured: record.featured === true,
          updatedAt: typeof record.updatedAt === "string" ? record.updatedAt : "",
        };
      })
      .filter((o): o is StudioMediaOption & { caption: string; featured: boolean; updatedAt: string } => o !== null);
  } catch {
    return [];
  }
}

/** Current Site Settings global as a plain object for the editor form. */
export async function loadSiteSettings(): Promise<Record<string, unknown>> {
  try {
    const payload = await getPayload({ config });
    const settings = await payload.findGlobal({ slug: "site-settings", overrideAccess: true, depth: 0 });
    return settings as unknown as Record<string, unknown>;
  } catch {
    return {};
  }
}

/** Current Navigation global (header/footer link arrays). */
export async function loadNavigation(): Promise<{ headerLinks: { label: string; href: string }[]; footerLinks: { label: string; href: string }[] }> {
  try {
    const payload = await getPayload({ config });
    const nav = (await payload.findGlobal({ slug: "navigation", overrideAccess: true, depth: 0 })) as unknown as Record<string, unknown>;
    const toLinks = (value: unknown) =>
      Array.isArray(value)
        ? value.map((item) => {
            const record = item as Record<string, unknown>;
            return { label: String(record.label ?? ""), href: String(record.href ?? "") };
          })
        : [];
    return { headerLinks: toLinks(nav.headerLinks), footerLinks: toLinks(nav.footerLinks) };
  } catch {
    return { headerLinks: [], footerLinks: [] };
  }
}

export type StudioAccount = { id: string; email: string; name: string; role: string };

/** All admin-panel accounts, for the Accounts manager (super admin only). */
export async function loadAccounts(): Promise<StudioAccount[]> {
  try {
    const payload = await getPayload({ config });
    const result = await payload.find({ collection: "users", overrideAccess: true, sort: "-createdAt", limit: 200, depth: 0 });
    return result.docs.map((doc) => {
      const record = doc as unknown as Record<string, unknown>;
      return {
        id: String(record.id ?? ""),
        email: typeof record.email === "string" ? record.email : "",
        name: typeof record.name === "string" ? record.name : "",
        role: typeof record.role === "string" ? record.role : "editor",
      };
    });
  } catch {
    return [];
  }
}

/** Generic loader for a content collection's documents as plain rows. */
export async function loadCollectionRows(collection: string): Promise<Record<string, unknown>[]> {
  try {
    const payload = await getPayload({ config });
    const result = await payload.find({ collection: collection as never, overrideAccess: true, sort: "_order", limit: 200, depth: 0 });
    return result.docs as Record<string, unknown>[];
  } catch {
    return [];
  }
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
  updatedAt: string;
};

function relationshipId(value: unknown): string | null {
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (value && typeof value === "object" && "id" in value) {
    const id = (value as { id?: unknown }).id;
    if (typeof id === "string" || typeof id === "number") return String(id);
  }
  return null;
}

/** Every edition, including drafts, used by the dedicated Results and Galleries workspaces. */
export async function loadEventEditions(): Promise<StudioEdition[]> {
  try {
    const payload = await getPayload({ config });
    const result = await payload.find({ collection: "event-editions", overrideAccess: true, sort: "-eventDate", limit: 100, depth: 0 });
    return result.docs.map((doc) => ({
      id: String(doc.id),
      name: doc.name,
      editionLabel: doc.editionLabel,
      slug: doc.slug,
      eventDate: doc.eventDate ?? "",
      galleryDescription: doc.galleryDescription ?? "",
      resultsUrl: doc.resultsUrl ?? "",
      resultsPublished: doc.resultsPublished,
      active: doc.active,
    }));
  } catch {
    return [];
  }
}

/** Event-gallery assets only; site/story images and partner logos stay outside this workspace. */
export async function loadGalleryMedia(): Promise<StudioGalleryPhoto[]> {
  try {
    const payload = await getPayload({ config });
    const result = await payload.find({
      collection: "media",
      overrideAccess: true,
      where: { assetType: { equals: "event-gallery" } },
      sort: "_order",
      limit: 1000,
      depth: 0,
    });
    return result.docs
      .map((doc) => {
        const base = toMediaOption(doc as unknown as Record<string, unknown>);
        if (!base) return null;
        return {
          ...base,
          caption: doc.caption ?? "",
          featured: doc.featured,
          showInGallery: doc.showInGallery,
          galleryEditionId: relationshipId(doc.galleryEdition),
          updatedAt: doc.updatedAt,
        };
      })
      .filter((photo): photo is StudioGalleryPhoto => photo !== null);
  } catch {
    return [];
  }
}

/** Edition explicitly selected for the homepage gallery preview. */
export async function loadFeaturedGalleryEditionId(): Promise<string | null> {
  try {
    const payload = await getPayload({ config });
    const settings = await payload.findGlobal({ slug: "site-settings", overrideAccess: true, depth: 0 });
    return relationshipId(settings.featuredGalleryEdition);
  } catch {
    return null;
  }
}
