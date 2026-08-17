import { cache } from "react";
import { getPayload } from "payload";
import config from "@payload-config";
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

export const loadPublicSiteData = cache(async () => {
  try {
    const payload = await getPayload({ config });
    const [settingsRecord, navigationRecord, categories, logistics, editions, galleryPhotos, highlights, faqs, sponsors] = await Promise.all([
      payload.findGlobal({ slug: "site-settings", overrideAccess: false, depth: 1 }),
      payload.findGlobal({ slug: "navigation", overrideAccess: false, depth: 0 }),
      payload.find({ collection: "race-categories", overrideAccess: false, where: { active: { equals: true } }, sort: "_order", limit: 20 }),
      payload.find({ collection: "event-logistics", overrideAccess: false, where: { active: { equals: true } }, sort: "_order", limit: 20 }),
      payload.find({ collection: "event-editions", overrideAccess: false, where: { active: { equals: true } }, sort: "-eventDate", limit: 100, depth: 0 }),
      payload.find({
        collection: "media",
        overrideAccess: false,
        where: {
          and: [
            { active: { equals: true } },
            { assetType: { equals: "event-gallery" } },
            { showInGallery: { equals: true } },
          ],
        },
        sort: "_order",
        limit: 1000,
        depth: 0,
      }),
      payload.find({ collection: "highlights", overrideAccess: false, where: { active: { equals: true } }, sort: "_order", limit: 30, depth: 1 }),
      payload.find({ collection: "faqs", overrideAccess: false, where: { active: { equals: true } }, sort: "_order", limit: 40 }),
      payload.find({ collection: "sponsors", overrideAccess: false, where: { active: { equals: true } }, sort: "_order", limit: 50, depth: 1 }),
    ]);

    const rawSettings = settingsRecord as unknown as Record<string, unknown>;
    const photosByEdition = new Map<string, PublicPhoto[]>();
    for (const item of galleryPhotos.docs) {
      const record = item as unknown as Record<string, unknown>;
      const editionId = relationshipId(record.galleryEdition);
      const photo = asPublicPhoto(record);
      if (!editionId || !photo) continue;
      const current = photosByEdition.get(editionId) ?? [];
      current.push(photo);
      photosByEdition.set(editionId, current);
    }
    const publicEditions: PublicEdition[] = editions.docs.map((item) => {
      const record = item as unknown as Record<string, unknown>;
      const id = String(record.id ?? "");
      return {
        id,
        name: String(record.name ?? ""),
        editionLabel: String(record.editionLabel ?? ""),
        slug: String(record.slug ?? ""),
        eventDate: typeof record.eventDate === "string" ? record.eventDate : null,
        galleryDescription: typeof record.galleryDescription === "string" ? record.galleryDescription : null,
        resultsUrl: typeof record.resultsUrl === "string" ? record.resultsUrl : null,
        resultsPublished: record.resultsPublished === true,
        photos: photosByEdition.get(id) ?? [],
      };
    }).filter((edition) => edition.id && edition.name && edition.slug);
    const featuredEditionId = relationshipId(rawSettings.featuredGalleryEdition);
    const homepageEdition = publicEditions.find((edition) => edition.id === featuredEditionId && edition.photos.length > 0)
      ?? publicEditions.find((edition) => edition.photos.length > 0);
    const publicPhotos = homepageEdition?.photos ?? [];
    const publicHighlights = highlights.docs.map((item) => {
      const record = item as unknown as Record<string, unknown>;
      return { title: String(record.title ?? ""), description: String(record.description ?? ""), photo: asPublicPhoto(record.photo), active: record.active !== false };
    }).filter((item) => item.title && item.description);
    const publicFaqs = faqs.docs.map((item) => {
      const record = item as unknown as Record<string, unknown>;
      return { question: String(record.question ?? ""), answer: String(record.answer ?? ""), active: record.active !== false };
    }).filter((item) => item.question && item.answer);
    const publicLogistics = logistics.docs.map((item) => {
      const record = item as unknown as Record<string, unknown>;
      const type = record.type === "bib-expo" ? "bib-expo" : "race-day";
      return {
        id: String(record.id ?? ""),
        title: String(record.title ?? ""),
        type,
        venue: String(record.venue ?? ""),
        address: String(record.address ?? ""),
        dateTime: String(record.dateTime ?? ""),
        directions: String(record.directions ?? ""),
        mapUrl: typeof record.mapUrl === "string" ? record.mapUrl : null,
      } satisfies PublicEventLogistic;
    }).filter((item) => item.id && item.title && item.venue && item.address && item.dateTime && item.directions);
    const publicSponsors = sponsors.docs.map((item) => {
      const record = item as unknown as Record<string, unknown>;
      return {
        name: String(record.name ?? ""),
        websiteUrl: typeof record.websiteUrl === "string" ? record.websiteUrl : null,
        description: typeof record.description === "string" ? record.description : null,
        logo: asPublicPhoto(record.logo),
        active: record.active !== false,
      };
    }).filter((item) => item.name);

    const rawHeroManifesto = (rawSettings.heroManifesto as Record<string, unknown> | undefined) ?? {};
    const rawStoryChapter = (rawSettings.storyChapter as Record<string, unknown> | undefined) ?? {};
    const rawCommunityChapter = (rawSettings.communityChapter as Record<string, unknown> | undefined) ?? {};
    const rawNavigation = navigationRecord as unknown as Record<string, unknown>;

    return {
      settings: {
        ...defaultSettings,
        ...(rawSettings as Partial<PublicSettings>),
        heroPhoto: asPublicPhoto(rawSettings.heroPhoto),
        showRegistrationCta: typeof rawSettings.showRegistrationCta === "boolean"
          ? rawSettings.showRegistrationCta
          : defaultSettings.showRegistrationCta,
        showResultsCta: typeof rawSettings.showResultsCta === "boolean"
          ? rawSettings.showResultsCta
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
      } satisfies PublicSettings,
      navigation: {
        headerLinks: asNavLinks(rawNavigation?.headerLinks, defaultNavigation.headerLinks),
        footerLinks: asNavLinks(rawNavigation?.footerLinks, defaultNavigation.footerLinks),
      } satisfies PublicNavigation,
      categories: categories.docs as unknown as PublicCategory[],
      logistics: publicLogistics,
      editions: publicEditions,
      photos: publicPhotos,
      databaseAvailable: true,
    };
  } catch (error) {
    console.error("Public content fallback active:", error instanceof Error ? error.message : "unknown error");
    return {
      settings: defaultSettings,
      navigation: defaultNavigation,
      categories: defaultCategories,
      logistics: [] as PublicEventLogistic[],
      editions: [] as PublicEdition[],
      photos: [] as PublicPhoto[],
      databaseAvailable: false,
    };
  }
});