import type { Payload } from "payload";
import {
  CONTENT_BOOTSTRAP_VERSION,
  defaultFaqs,
  defaultFooterLinks,
  defaultHeaderLinks,
  defaultRaceCategories,
  defaultSiteSettings,
} from "@/lib/default-content";

type MutableRecord = Record<string, unknown>;
const isUnset = (value: unknown) => value === null || value === undefined;

/**
 * Content carried over from Agomoni Run 1.0 (the 2025 women's-safety edition).
 * A field still holding exactly this text was never edited by an admin, so it is
 * safe to upgrade it to the current default. Any admin-customised value differs
 * from these strings and is left untouched.
 */
const supersededSettings: Record<string, string> = {
  tagline: "Run with strength. Run for safety.",
  heroHeading: "Run with strength. Run for safety.",
  heroSubheading: "As Bengal prepares to welcome Maa Durga, Barasat comes together for a celebration of courage, community and movement.",
  organiserDescription: "A community of runners bringing Barasat together through movement, respect and collective responsibility.",
  about: "Agomoni Run brings runners and the local community together in Barasat, combining the energy of road running with Bengal’s Agomoni spirit. Running together represents courage, respect, unity and our shared responsibility to make public spaces safer for women.",
};
const supersededHeroManifesto: Record<string, string> = { line1: "Run with strength.", line2: "Run for safety." };
const supersededStoryChapter: Record<string, string> = { word: "TOGETHER", heading: "Safety is not a finish line. It is a responsibility we share." };
const supersededCommunityChapter: Record<string, string> = {
  tag: "MOVE \u00b7 WELCOME \u00b7 PROTECT",
  body: "We welcome Maa Durga through movement, positive social action and the strength of a community choosing to look out for one another.",
};
const supersededRaceDescriptions: Record<string, string> = {
  "5k": "An accessible city run for runners beginning their race-day journey and community members moving together for women’s safety.",
  "10k": "A focused road-running challenge through Barasat, carrying a collective message of courage, respect and safer public spaces.",
};

/** Overwrite themed fields only where they still hold last year's exact default text. */
function upgradeGroup(current: MutableRecord, key: string, superseded: Record<string, string>, replacement: Record<string, unknown>, into: MutableRecord): void {
  const group = current[key];
  if (!group || typeof group !== "object") return;
  const source = group as MutableRecord;
  const next = { ...source };
  let changed = false;
  for (const [field, oldValue] of Object.entries(superseded)) {
    if (source[field] === oldValue) {
      next[field] = replacement[field];
      changed = true;
    }
  }
  if (changed) into[key] = next;
}

export async function initializeDefaultContent(payload: Payload): Promise<void> {
  if (process.argv.some((argument) => argument.includes("migrate"))) return;

  const marker = await payload.find({
    collection: "payload-kv",
    depth: 0,
    limit: 1,
    where: { key: { equals: "agomoni-content-bootstrap" } },
  });
  const markerData = marker.docs[0]?.data as { version?: number } | undefined;
  if ((markerData?.version ?? 0) >= CONTENT_BOOTSTRAP_VERSION) return;

  const settings = await payload.findGlobal({ slug: "site-settings", depth: 0 });
  const current = settings as unknown as MutableRecord;

  const [categories, faqCount] = await Promise.all([
    payload.find({ collection: "race-categories", depth: 0, limit: 100 }),
    payload.count({ collection: "faqs" }),
  ]);
  const existingNames = new Set(categories.docs.map((category) => category.name.trim().toLocaleLowerCase("en")));

  for (const category of defaultRaceCategories) {
    if (!existingNames.has(category.name.toLocaleLowerCase("en"))) {
      await payload.create({ collection: "race-categories", data: category });
    }
  }
  if (faqCount.totalDocs === 0) {
    for (const faq of defaultFaqs) await payload.create({ collection: "faqs", data: faq });
  }

  const missingSettings: MutableRecord = {};
  for (const [key, value] of Object.entries(defaultSiteSettings)) {
    if (isUnset(current[key])) missingSettings[key] = value;
  }

  // One-time content upgrade: replace any field still holding the superseded
  // Agomoni Run 1.0 text with the current default, without clobbering admin edits.
  const defaults = defaultSiteSettings as unknown as MutableRecord;
  for (const [key, oldValue] of Object.entries(supersededSettings)) {
    if (current[key] === oldValue) missingSettings[key] = defaults[key];
  }
  upgradeGroup(current, "heroManifesto", supersededHeroManifesto, defaultSiteSettings.heroManifesto, missingSettings);
  upgradeGroup(current, "storyChapter", supersededStoryChapter, defaultSiteSettings.storyChapter, missingSettings);
  upgradeGroup(current, "communityChapter", supersededCommunityChapter, defaultSiteSettings.communityChapter, missingSettings);

  await payload.updateGlobal({ slug: "site-settings", data: missingSettings });

  for (const category of categories.docs) {
    const key = category.name.trim().toLocaleLowerCase("en");
    const supersededDescription = supersededRaceDescriptions[key];
    const replacement = defaultRaceCategories.find((item) => item.name.toLocaleLowerCase("en") === key);
    if (supersededDescription && replacement && (category as unknown as MutableRecord).description === supersededDescription) {
      await payload.update({ collection: "race-categories", id: category.id, data: { description: replacement.description } });
    }
  }

  const navigation = (await payload.findGlobal({ slug: "navigation", depth: 0 })) as unknown as MutableRecord;
  const missingNavigation: MutableRecord = {};
  if (isUnset(navigation.headerLinks) || (Array.isArray(navigation.headerLinks) && navigation.headerLinks.length === 0)) {
    missingNavigation.headerLinks = defaultHeaderLinks;
  }
  if (isUnset(navigation.footerLinks) || (Array.isArray(navigation.footerLinks) && navigation.footerLinks.length === 0)) {
    missingNavigation.footerLinks = defaultFooterLinks;
  }
  if (Object.keys(missingNavigation).length > 0) {
    await payload.updateGlobal({ slug: "navigation", data: missingNavigation });
  }

  if (marker.docs[0]) {
    await payload.update({ collection: "payload-kv", id: marker.docs[0].id, data: { key: "agomoni-content-bootstrap", data: { version: CONTENT_BOOTSTRAP_VERSION } } });
  } else {
    await payload.create({ collection: "payload-kv", data: { key: "agomoni-content-bootstrap", data: { version: CONTENT_BOOTSTRAP_VERSION } } });
  }
}