import { cache } from "react";
import { getServerApiBase } from "@/lib/api-base";
import {
  defaultFaqs,
  defaultFooterLinks,
  defaultHeaderLinks,
  defaultRaceCategories,
  defaultSiteSettings,
} from "@/lib/default-content";
import { buildPublicImageUrl } from "@/lib/image-url";

export type PublicCategory = {
  id: string;
  name: string;
  distance: string;
  fee: string;
  reportingTime: string;
  startTime: string;
  description: string;
  ageEligibility?: string | null;
  inclusions?: { item: string }[] | null;
};

export type PublicPhoto = {
  id: string;
  url: string;
  altText: string;
  caption?: string | null;
  width?: number | null;
  height?: number | null;
};

export type PublicEdition = {
  id: string;
  name: string;
  editionLabel: string;
  slug: string;
  eventDate?: string | null;
  galleryDescription?: string | null;
  resultsUrl?: string | null;
  resultsPublished: boolean;
  photos: PublicPhoto[];
};

type PublicHighlight = {
  title: string;
  description: string;
  photo?: PublicPhoto | null;
  active: boolean;
};

type PublicSponsor = {
  name: string;
  websiteUrl?: string | null;
  description?: string | null;
  logo?: PublicPhoto | null;
  active: boolean;
};

export type PublicEventLogistic = {
  id: string;
  title: string;
  type: "race-day" | "bib-expo";
  venue: string;
  address: string;
  dateTime: string;
  directions: string;
  mapUrl?: string | null;
};

export type PublicNavLink = { label: string; href: string };

export type PublicNavigation = {
  headerLinks: PublicNavLink[];
  footerLinks: PublicNavLink[];
};

export type HeroManifesto = {
  bengaliWord: string;
  line1: string;
  line2: string;
  wordmarkTop: string;
  wordmarkBottom: string;
  wordmarkYear: string;
  routeLineStart: string;
  routeLineEnd: string;
};

export type StoryChapter = {
  image?: PublicPhoto | null;
  imageAlt: string;
  word: string;
  lead: string;
  heading: string;
};

export type CommunityChapter = {
  image?: PublicPhoto | null;
  imageAlt: string;
  tag: string;
  heading: string;
  body: string;
  ctaLabel: string;
};

export type PublicSettings = {
  eventName: string;
  tagline: string;
  eventDateTime: string;
  timingConfirmed: boolean;
  timezone: string;
  venue: string;
  organiserName: string;
  organiserDescription: string;
  heroHeading: string;
  heroSubheading: string;
  heroPhoto?: PublicPhoto | null;
  registrationUrl?: string | null;
  resultsUrl?: string | null;
  registrationStatus: "soon" | "open" | "closed" | "completed";
  showRegistrationCta: boolean;
  showResultsCta: boolean;
  about: string;
  highlights: PublicHighlight[];
  faqs: { question: string; answer: string; active: boolean }[];
  sponsors: PublicSponsor[];
  announcement?: { enabled?: boolean; text?: string | null; linkLabel?: string | null; linkUrl?: string | null } | null;
  contactEmail?: string | null;
  primaryPhone?: string | null;
  secondaryPhone?: string | null;
  instagramUrl?: string | null;
  facebookUrl?: string | null;
  youtubeUrl?: string | null;
  galleryTitle: string;
  galleryDescription: string;
  logisticsHeading: string;
  logisticsSubheading: string;
  heroManifesto: HeroManifesto;
  aboutBengaliWord: string;
  aboutHeading: string;
  storyChapter: StoryChapter;
  communityChapter: CommunityChapter;
};

const defaultSettings: PublicSettings = {
  ...defaultSiteSettings,
  highlights: [],
  faqs: defaultFaqs.map((faq) => ({ ...faq })),
  sponsors: [],
  storyChapter: { ...defaultSiteSettings.storyChapter, image: null },
  communityChapter: { ...defaultSiteSettings.communityChapter, image: null },
};

const defaultNavigation: PublicNavigation = {
  headerLinks: defaultHeaderLinks.map((link) => ({ ...link })),
  footerLinks: defaultFooterLinks.map((link) => ({ ...link })),
};

const defaultCategories: PublicCategory[] = defaultRaceCategories.map((category) => ({
  ...category,
  id: category.name.toLocaleLowerCase("en"),
}));

// ---------------------------------------------------------------------------
// Helpers to normalise raw Payload REST responses into typed public shapes.
// The VPS REST API returns the full document; we just pick what the frontend
// needs and rebuild image URLs through imgproxy.
// ---------------------------------------------------------------------------

function asPublicPhoto(value: unknown): PublicPhoto | null {
  if (!value || typeof value !== "object") return null;
  const photo = value as Record<string, unknown>;
  if (typeof photo.id !== "string" && typeof photo.id !== "number") return null;
  const id = String(photo.id);
  return {
    id,
    url: buildPublicImageUrl(id),
    altText: typeof photo.altText === "string" ? photo.altText : "Agomoni Run event photograph",
    caption: typeof photo.caption === "string" ? photo.caption : null,
    width: typeof photo.width === "number" ? photo.width : null,
    height: typeof photo.height === "number" ? photo.height : null,
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

function asNavLinks(value: unknown, fallback: PublicNavLink[]): PublicNavLink[] {
  if (!Array.isArray(value) || value.length === 0) return fallback;
  const links = value
    .map((item) => {
      const record = item as Record<string, unknown>;
      return { label: String(record.label ?? ""), href: String(record.href ?? "") };
    })
    .filter((link) => link.label && link.href);
  return links.length > 0 ? links : fallback;
}

// ---------------------------------------------------------------------------
// The VPS exposes a single aggregated endpoint that returns everything the
// frontend needs in one request, avoiding 9 separate round-trips.
// Endpoint: GET /api/public-data  (unauthenticated, read-only)
//
// Falls back to the Payload REST API if the aggregated endpoint is unavailable,
// and falls back again to hardcoded defaults if the VPS is unreachable.
// ---------------------------------------------------------------------------

function getApiBase(): string {
  return getServerApiBase();
}

type PayloadListResponse = { docs: Record<string, unknown>[]; totalDocs: number };
type PayloadGlobalResponse = Record<string, unknown>;

async function payloadGet<T>(path: string): Promise<T | null> {
  try {
    const url = `${getApiBase()}${path}`;
    const res = await fetch(url, { next: { revalidate: 0 }, cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function fetchPublicSiteDataFromApi() {
  const [
    settingsRaw,
    navigationRaw,
    categoriesRaw,
    logisticsRaw,
    editionsRaw,
    galleryPhotosRaw,
    featuredPhotosRaw,
    highlightsRaw,
    faqsRaw,
    sponsorsRaw,
  ] = await Promise.all([
    payloadGet<PayloadGlobalResponse>("/api/globals/site-settings?depth=1"),
    payloadGet<PayloadGlobalResponse>("/api/globals/navigation?depth=0"),
    payloadGet<PayloadListResponse>("/api/race-categories?where[active][equals]=true&sort=_order&limit=20"),
    payloadGet<PayloadListResponse>("/api/event-logistics?where[active][equals]=true&sort=_order&limit=20"),
    payloadGet<PayloadListResponse>("/api/event-editions?where[active][equals]=true&sort=-eventDate&limit=100"),
    // "In gallery" photos — the public /gallery archive pages.
    payloadGet<PayloadListResponse>(
      "/api/media?where[active][equals]=true&where[assetType][equals]=event-gallery&where[showInGallery][equals]=true&sort=_order&limit=1000",
    ),
    // "Featured" photos — the homepage gallery preview.
    payloadGet<PayloadListResponse>(
      "/api/media?where[active][equals]=true&where[assetType][equals]=event-gallery&where[featured][equals]=true&sort=_order&limit=1000",
    ),
    payloadGet<PayloadListResponse>("/api/highlights?where[active][equals]=true&sort=_order&limit=30&depth=1"),
    payloadGet<PayloadListResponse>("/api/faqs?where[active][equals]=true&sort=_order&limit=40"),
    payloadGet<PayloadListResponse>("/api/sponsors?where[active][equals]=true&sort=_order&limit=50&depth=1"),
  ]);

  // A single failing resource (e.g. one global erroring) must not blank the
  // whole site — defaults fill in for whatever is missing.
  const settingsData = settingsRaw ?? ({} as PayloadGlobalResponse);

  // --- editions + gallery photos ---
  const groupPhotosByEdition = (docs: Record<string, unknown>[] | undefined) => {
    const byEdition = new Map<string, PublicPhoto[]>();
    for (const item of docs ?? []) {
      const editionId = relationshipId(item.galleryEdition);
      const photo = asPublicPhoto(item);
      if (!editionId || !photo) continue;
      const current = byEdition.get(editionId) ?? [];
      current.push(photo);
      byEdition.set(editionId, current);
    }
    return byEdition;
  };
  const photosByEdition = groupPhotosByEdition(galleryPhotosRaw?.docs);
  const featuredByEdition = groupPhotosByEdition(featuredPhotosRaw?.docs);

  const publicEditions: PublicEdition[] = (editionsRaw?.docs ?? [])
    .map((item) => {
      const id = String(item.id ?? "");
      return {
        id,
        name: String(item.name ?? ""),
        editionLabel: String(item.editionLabel ?? ""),
        slug: String(item.slug ?? ""),
        eventDate: typeof item.eventDate === "string" ? item.eventDate : null,
        galleryDescription: typeof item.galleryDescription === "string" ? item.galleryDescription : null,
        resultsUrl: typeof item.resultsUrl === "string" ? item.resultsUrl : null,
        resultsPublished: item.resultsPublished === true,
        photos: photosByEdition.get(id) ?? [],
      };
    })
    .filter((e) => e.id && e.name && e.slug);

  const featuredEditionId = relationshipId(settingsData.featuredGalleryEdition);
  const featuredEdition = publicEditions.find((e) => e.id === featuredEditionId);
  const featuredCount = (edition: PublicEdition | undefined) =>
    edition ? (featuredByEdition.get(edition.id) ?? []).length : 0;
  const firstEditionWithFeatured = publicEditions.find((e) => featuredCount(e) > 0);
  // The homepage preview shows the edition's Featured photos. The heading must
  // always match the pictures, so an edition with no Featured photos yet lends
  // only its name to the empty state.
  const homepageEdition =
    (featuredEdition && featuredCount(featuredEdition) > 0 ? featuredEdition : firstEditionWithFeatured) ??
    featuredEdition ??
    null;
  const publicPhotos = homepageEdition ? (featuredByEdition.get(homepageEdition.id) ?? []) : [];

  // --- highlights ---
  const publicHighlights = (highlightsRaw?.docs ?? [])
    .map((item) => ({
      title: String(item.title ?? ""),
      description: String(item.description ?? ""),
      photo: asPublicPhoto(item.photo),
      active: item.active !== false,
    }))
    .filter((h) => h.title && h.description);

  // --- faqs ---
  const publicFaqs = (faqsRaw?.docs ?? [])
    .map((item) => ({
      question: String(item.question ?? ""),
      answer: String(item.answer ?? ""),
      active: item.active !== false,
    }))
    .filter((f) => f.question && f.answer);

  // --- logistics ---
  const publicLogistics = (logisticsRaw?.docs ?? [])
    .map((item) => ({
      id: String(item.id ?? ""),
      title: String(item.title ?? ""),
      type: item.type === "bib-expo" ? ("bib-expo" as const) : ("race-day" as const),
      venue: String(item.venue ?? ""),
      address: String(item.address ?? ""),
      dateTime: String(item.dateTime ?? ""),
      directions: String(item.directions ?? ""),
      mapUrl: typeof item.mapUrl === "string" ? item.mapUrl : null,
    }))
    .filter((l) => l.id && l.title && l.venue && l.address && l.dateTime && l.directions);

  // --- sponsors ---
  const publicSponsors = (sponsorsRaw?.docs ?? [])
    .map((item) => ({
      name: String(item.name ?? ""),
      websiteUrl: typeof item.websiteUrl === "string" ? item.websiteUrl : null,
      description: typeof item.description === "string" ? item.description : null,
      logo: asPublicPhoto(item.logo),
      active: item.active !== false,
    }))
    .filter((s) => s.name);

  // --- categories ---
  const publicCategories = (categoriesRaw?.docs ?? []) as unknown as PublicCategory[];

  // --- settings ---
  const rawHeroManifesto = (settingsData.heroManifesto as Record<string, unknown> | undefined) ?? {};
  const rawStoryChapter = (settingsData.storyChapter as Record<string, unknown> | undefined) ?? {};
  const rawCommunityChapter = (settingsData.communityChapter as Record<string, unknown> | undefined) ?? {};

  const settings: PublicSettings = {
    ...defaultSettings,
    ...(settingsData as Partial<PublicSettings>),
    heroPhoto: asPublicPhoto(settingsData.heroPhoto),
    logisticsHeading:
      typeof settingsData.logisticsHeading === "string" && settingsData.logisticsHeading.trim()
        ? settingsData.logisticsHeading
        : defaultSettings.logisticsHeading,
    logisticsSubheading:
      typeof settingsData.logisticsSubheading === "string" && settingsData.logisticsSubheading.trim()
        ? settingsData.logisticsSubheading
        : defaultSettings.logisticsSubheading,
    showRegistrationCta:
      typeof settingsData.showRegistrationCta === "boolean"
        ? settingsData.showRegistrationCta
        : defaultSettings.showRegistrationCta,
    showResultsCta:
      typeof settingsData.showResultsCta === "boolean"
        ? settingsData.showResultsCta
        : defaultSettings.showResultsCta,
    highlights: publicHighlights,
    faqs: publicFaqs,
    sponsors: publicSponsors,
    heroManifesto: { ...defaultSettings.heroManifesto, ...rawHeroManifesto },
    storyChapter: {
      ...defaultSettings.storyChapter,
      ...rawStoryChapter,
      image: asPublicPhoto(rawStoryChapter.image),
    },
    communityChapter: {
      ...defaultSettings.communityChapter,
      ...rawCommunityChapter,
      image: asPublicPhoto(rawCommunityChapter.image),
    },
  };

  const navigation: PublicNavigation = {
    headerLinks: asNavLinks(
      (navigationRaw as Record<string, unknown>)?.headerLinks,
      defaultNavigation.headerLinks,
    ),
    footerLinks: asNavLinks(
      (navigationRaw as Record<string, unknown>)?.footerLinks,
      defaultNavigation.footerLinks,
    ),
  };

  return {
    settings,
    navigation,
    categories: publicCategories,
    logistics: publicLogistics,
    editions: publicEditions,
    photos: publicPhotos,
    homepageEdition,
    databaseAvailable: true,
  };
}

/** Loads all public site data. On Vercel this fetches from the VPS REST API.
 *  On the VPS monolith this also uses the REST API (same-origin). Falls back
 *  to hardcoded defaults if the API is unreachable. */
export const loadPublicSiteData = cache(async () => {
  try {
    const data = await fetchPublicSiteDataFromApi();
    if (data) return data;
  } catch (error) {
    console.error("Public content fallback active:", error instanceof Error ? error.message : "unknown error");
  }

  return {
    settings: defaultSettings,
    navigation: defaultNavigation,
    categories: defaultCategories,
    logistics: [] as PublicEventLogistic[],
    editions: [] as PublicEdition[],
    photos: [] as PublicPhoto[],
    homepageEdition: null as PublicEdition | null,
    databaseAvailable: false,
  };
});
