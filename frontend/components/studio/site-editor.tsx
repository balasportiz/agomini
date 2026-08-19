"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { SiteImageField } from "@/components/studio/site-image-field";
import { SaveBar } from "@/components/studio/save-bar";
import { useStudioForm } from "@/components/studio/use-studio-form";
import { updateGlobal } from "@/components/studio/studio-api";
import { defaultSiteSettings } from "@/lib/default-content";
import type { StudioMediaOption } from "@/lib/studio-data";

type Group = Record<string, unknown>;
type Values = {
  eventName: string;
  tagline: string;
  eventDateTime: string;
  timingConfirmed: boolean;
  timezone: string;
  venue: string;
  organiserName: string;
  organiserDescription: string;
  logisticsHeading: string;
  logisticsSubheading: string;
  heroHeading: string;
  heroSubheading: string;
  heroPhoto: string | null;
  registrationStatus: string;
  showRegistrationCta: boolean;
  showResultsCta: boolean;
  registrationUrl: string;
  resultsUrl: string;
  heroManifesto: Group;
  aboutBengaliWord: string;
  aboutHeading: string;
  about: string;
  storyChapter: Group;
  communityChapter: Group;
  announcement: Group;
  contactEmail: string;
  primaryPhone: string;
  secondaryPhone: string;
  instagramUrl: string;
  facebookUrl: string;
  youtubeUrl: string;
  galleryTitle: string;
  galleryDescription: string;
  seo: Group;
};

const str = (v: unknown, fallback = "") => (typeof v === "string" ? v : fallback);
const bool = (v: unknown) => v === true;
const rel = (v: unknown): string | null => {
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  if (v && typeof v === "object" && "id" in v) return String((v as { id: unknown }).id);
  return null;
};

function toLocalInput(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function fromLocalInput(local: string): string {
  if (!local) return "";
  const d = new Date(local);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString();
}

const TABS = [
  { id: "event", label: "Event details" },
  { id: "hero", label: "Hero & buttons" },
  { id: "story", label: "Story sections" },
  { id: "contact", label: "Contact & gallery" },
  { id: "seo", label: "SEO" },
] as const;
type TabId = (typeof TABS)[number]["id"];

export function SiteEditor({
  initial,
  siteImages,
  defaultTab = "event",
}: {
  initial: Group;
  siteImages: StudioMediaOption[];
  /** Opens straight to a specific tab, e.g. for a section deep-linking here. */
  defaultTab?: TabId;
}) {
  const [tab, setTab] = useState<TabId>(defaultTab);
  const hero = (initial.heroManifesto as Group) ?? {};
  const story = (initial.storyChapter as Group) ?? {};
  const community = (initial.communityChapter as Group) ?? {};
  const announcement = (initial.announcement as Group) ?? {};
  const seo = (initial.seo as Group) ?? {};

  const { values, setValue, dirty, saving, save } = useStudioForm<Values>({
    eventName: str(initial.eventName),
    tagline: str(initial.tagline),
    eventDateTime: str(initial.eventDateTime),
    timingConfirmed: bool(initial.timingConfirmed),
    timezone: str(initial.timezone, "Asia/Kolkata"),
    venue: str(initial.venue),
    organiserName: str(initial.organiserName),
    organiserDescription: str(initial.organiserDescription),
    logisticsHeading: str(initial.logisticsHeading, defaultSiteSettings.logisticsHeading),
    logisticsSubheading: str(initial.logisticsSubheading, defaultSiteSettings.logisticsSubheading),
    heroHeading: str(initial.heroHeading),
    heroSubheading: str(initial.heroSubheading),
    heroPhoto: rel(initial.heroPhoto),
    registrationStatus: str(initial.registrationStatus, "soon"),
    showRegistrationCta: bool(initial.showRegistrationCta),
    showResultsCta: bool(initial.showResultsCta),
    registrationUrl: str(initial.registrationUrl),
    resultsUrl: str(initial.resultsUrl),
    heroManifesto: {
      bengaliWord: str(hero.bengaliWord),
      line1: str(hero.line1),
      line2: str(hero.line2),
      wordmarkTop: str(hero.wordmarkTop),
      wordmarkBottom: str(hero.wordmarkBottom),
      wordmarkYear: str(hero.wordmarkYear),
      routeLineStart: str(hero.routeLineStart),
      routeLineEnd: str(hero.routeLineEnd),
    },
    aboutBengaliWord: str(initial.aboutBengaliWord),
    aboutHeading: str(initial.aboutHeading),
    about: str(initial.about),
    storyChapter: {
      image: rel(story.image),
      imageAlt: str(story.imageAlt),
      word: str(story.word),
      lead: str(story.lead),
      heading: str(story.heading),
    },
    communityChapter: {
      image: rel(community.image),
      imageAlt: str(community.imageAlt),
      tag: str(community.tag),
      heading: str(community.heading),
      body: str(community.body),
      ctaLabel: str(community.ctaLabel),
    },
    announcement: {
      enabled: bool(announcement.enabled),
      text: str(announcement.text),
      linkLabel: str(announcement.linkLabel),
      linkUrl: str(announcement.linkUrl),
    },
    contactEmail: str(initial.contactEmail),
    primaryPhone: str(initial.primaryPhone),
    secondaryPhone: str(initial.secondaryPhone),
    instagramUrl: str(initial.instagramUrl),
    facebookUrl: str(initial.facebookUrl),
    youtubeUrl: str(initial.youtubeUrl),
    galleryTitle: str(initial.galleryTitle),
    galleryDescription: str(initial.galleryDescription),
    seo: {
      title: str(seo.title, defaultSiteSettings.seo.title),
      description: str(seo.description, defaultSiteSettings.seo.description),
      keywords: str(seo.keywords, defaultSiteSettings.seo.keywords),
      ogTitle: str(seo.ogTitle, defaultSiteSettings.seo.ogTitle),
      ogDescription: str(seo.ogDescription, defaultSiteSettings.seo.ogDescription),
      googleSiteVerification: str(seo.googleSiteVerification),
    },
  });

  const setGroup = (group: "heroManifesto" | "storyChapter" | "communityChapter" | "announcement" | "seo", key: string, value: unknown) =>
    setValue(group, { ...(values[group] as Group), [key]: value });

  async function handleSave() {
    await save((v) => updateGlobal("site-settings", v as unknown as Record<string, unknown>));
  }

  const pageHead = {
    event: { title: "Site & story", desc: "Your event details and the words shown across the homepage. Everything here updates the live site as soon as you save." },
    hero: { title: "Registration & results", desc: "Where the Register and Results buttons send people, and the opening message shown while people wait. This also controls what the /register and /results pages show." },
    story: { title: "Site & story", desc: "Your event details and the words shown across the homepage. Everything here updates the live site as soon as you save." },
    contact: { title: "Contact & gallery settings", desc: "Contact details, the announcement banner, and the title/description shown on the Gallery page." },
    seo: { title: "Search & SEO", desc: "Titles, descriptions and Google verification. This is what Google, ChatGPT, Claude and other assistants read as the official Agomoni Run site." },
  }[tab];

  return (
    <div className="studio-content__inner">
      <div className="studio-page-head" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          <h2>{pageHead.title}</h2>
          <p>{pageHead.desc}</p>
        </div>
        {tab === "hero" && (
          <div className="studio-inline-actions">
            <a href="/register" target="_blank" rel="noreferrer" className="studio-hint" style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", textDecoration: "underline" }}>
              Open /register ↗
            </a>
            <a href="/results" target="_blank" rel="noreferrer" className="studio-hint" style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", textDecoration: "underline" }}>
              Open /results ↗
            </a>
          </div>
        )}
        {tab === "contact" && (
          <a href="/gallery" target="_blank" rel="noreferrer" className="studio-hint" style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", textDecoration: "underline" }}>
            Open /gallery ↗
          </a>
        )}
        {tab === "seo" && (
          <div className="studio-inline-actions">
            <a href="/sitemap.xml" target="_blank" rel="noreferrer" className="studio-hint" style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", textDecoration: "underline" }}>
              Open sitemap ↗
            </a>
            <a href="/llms.txt" target="_blank" rel="noreferrer" className="studio-hint" style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", textDecoration: "underline" }}>
              Open llms.txt ↗
            </a>
          </div>
        )}
      </div>

      <div className="studio-tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} data-active={tab === t.id} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "event" && (
        <div className="studio-card">
          <div className="studio-card__body">
            <div className="studio-grid studio-grid--2">
              <Field label="Event name"><Input value={values.eventName} onChange={(e) => setValue("eventName", e.target.value)} /></Field>
              <Field label="Tagline"><Input value={values.tagline} onChange={(e) => setValue("tagline", e.target.value)} /></Field>
            </div>
            <div className="studio-grid studio-grid--2">
              <Field label="Date & time" hint={`Shown in ${values.timezone || "the event timezone"}. Edited in your local time.`}>
                <Input type="datetime-local" value={toLocalInput(values.eventDateTime)} onChange={(e) => setValue("eventDateTime", fromLocalInput(e.target.value))} />
              </Field>
              <Field label="Timezone" hint="IANA timezone, e.g. Asia/Kolkata."><Input value={values.timezone} onChange={(e) => setValue("timezone", e.target.value)} /></Field>
            </div>
            <Toggle label="Start time confirmed" hint="Turn on once the official flag-off time is approved." checked={values.timingConfirmed} onChange={(v) => setValue("timingConfirmed", v)} />
            <Field label="Venue"><Input value={values.venue} onChange={(e) => setValue("venue", e.target.value)} /></Field>
            <Field label="Organiser name"><Input value={values.organiserName} onChange={(e) => setValue("organiserName", e.target.value)} /></Field>
            <Field label="Organiser description"><Textarea rows={3} value={values.organiserDescription} onChange={(e) => setValue("organiserDescription", e.target.value)} /></Field>
            <div className="studio-grid studio-grid--2">
              <Field label="Event day heading" hint="Large heading above the arrival and bib-collection entries."><Input value={values.logisticsHeading} onChange={(e) => setValue("logisticsHeading", e.target.value)} /></Field>
              <Field label="Event day sub-heading" hint="One line beside the heading."><Input value={values.logisticsSubheading} onChange={(e) => setValue("logisticsSubheading", e.target.value)} /></Field>
            </div>
          </div>
        </div>
      )}

      {tab === "hero" && (
        <>
          <div className="studio-card">
            <div className="studio-card__head"><h3>Opening message</h3><p>The big headline and intro at the top of the homepage.</p></div>
            <div className="studio-card__body">
              <Field label="Hero heading"><Input value={values.heroHeading} onChange={(e) => setValue("heroHeading", e.target.value)} /></Field>
              <Field label="Hero sub-heading"><Textarea rows={2} value={values.heroSubheading} onChange={(e) => setValue("heroSubheading", e.target.value)} /></Field>
              <Field label="Hero background photo" hint="Upload a wide, high-quality image. Leave empty to use the default.">
                <SiteImageField value={values.heroPhoto} options={siteImages} onChange={(id) => setValue("heroPhoto", id)} label="hero photo" />
              </Field>
            </div>
          </div>

          <div className="studio-card">
            <div className="studio-card__head"><h3>Buttons &amp; registration</h3></div>
            <div className="studio-card__body">
              <Field label="Registration status">
                <NativeSelect
                  value={values.registrationStatus}
                  onChange={(v) => setValue("registrationStatus", v)}
                  options={[
                    { value: "soon", label: "Opening soon" },
                    { value: "open", label: "Open" },
                    { value: "closed", label: "Closed" },
                    { value: "completed", label: "Race completed" },
                  ]}
                />
              </Field>
              <Toggle label="Show Register buttons" checked={values.showRegistrationCta} onChange={(v) => setValue("showRegistrationCta", v)} />
              <Toggle label="Show Results buttons" checked={values.showResultsCta} onChange={(v) => setValue("showResultsCta", v)} />
              <div className="studio-grid studio-grid--2">
                <Field label="Registration link" hint="Where the Register button sends people. Leave empty until ready."><Input value={values.registrationUrl} onChange={(e) => setValue("registrationUrl", e.target.value)} placeholder="https://…" /></Field>
                <Field label="Results link" hint="Where the Results button sends people."><Input value={values.resultsUrl} onChange={(e) => setValue("resultsUrl", e.target.value)} placeholder="https://…" /></Field>
              </div>
            </div>
          </div>

          <div className="studio-card">
            <div className="studio-card__head"><h3>Hero overlay text</h3><p>The large decorative wording layered over the hero image.</p></div>
            <div className="studio-card__body">
              <div className="studio-grid studio-grid--2">
                <Field label="Bengali word"><Input value={str(values.heroManifesto.bengaliWord)} onChange={(e) => setGroup("heroManifesto", "bengaliWord", e.target.value)} /></Field>
                <Field label="Wordmark year"><Input value={str(values.heroManifesto.wordmarkYear)} onChange={(e) => setGroup("heroManifesto", "wordmarkYear", e.target.value)} /></Field>
                <Field label="Manifesto line 1"><Input value={str(values.heroManifesto.line1)} onChange={(e) => setGroup("heroManifesto", "line1", e.target.value)} /></Field>
                <Field label="Manifesto line 2"><Input value={str(values.heroManifesto.line2)} onChange={(e) => setGroup("heroManifesto", "line2", e.target.value)} /></Field>
                <Field label="Wordmark top"><Input value={str(values.heroManifesto.wordmarkTop)} onChange={(e) => setGroup("heroManifesto", "wordmarkTop", e.target.value)} /></Field>
                <Field label="Wordmark bottom"><Input value={str(values.heroManifesto.wordmarkBottom)} onChange={(e) => setGroup("heroManifesto", "wordmarkBottom", e.target.value)} /></Field>
                <Field label="Route line start"><Input value={str(values.heroManifesto.routeLineStart)} onChange={(e) => setGroup("heroManifesto", "routeLineStart", e.target.value)} /></Field>
                <Field label="Route line end"><Input value={str(values.heroManifesto.routeLineEnd)} onChange={(e) => setGroup("heroManifesto", "routeLineEnd", e.target.value)} /></Field>
              </div>
            </div>
          </div>
        </>
      )}

      {tab === "story" && (
        <>
          <div className="studio-card">
            <div className="studio-card__head"><h3>About the run</h3></div>
            <div className="studio-card__body">
              <div className="studio-grid studio-grid--2">
                <Field label="Bengali word"><Input value={values.aboutBengaliWord} onChange={(e) => setValue("aboutBengaliWord", e.target.value)} /></Field>
                <Field label="Heading"><Input value={values.aboutHeading} onChange={(e) => setValue("aboutHeading", e.target.value)} /></Field>
              </div>
              <Field label="About text"><Textarea rows={4} value={values.about} onChange={(e) => setValue("about", e.target.value)} /></Field>
            </div>
          </div>

          <div className="studio-card">
            <div className="studio-card__head"><h3>Story chapter</h3><p>The first full-width image section.</p></div>
            <div className="studio-card__body">
              <Field label="Image"><SiteImageField value={rel(values.storyChapter.image)} options={siteImages} onChange={(id) => setGroup("storyChapter", "image", id)} label="image" /></Field>
              <Field label="Image description (alt text)"><Input value={str(values.storyChapter.imageAlt)} onChange={(e) => setGroup("storyChapter", "imageAlt", e.target.value)} /></Field>
              <div className="studio-grid studio-grid--2">
                <Field label="Overlay word"><Input value={str(values.storyChapter.word)} onChange={(e) => setGroup("storyChapter", "word", e.target.value)} /></Field>
                <Field label="Lead line"><Input value={str(values.storyChapter.lead)} onChange={(e) => setGroup("storyChapter", "lead", e.target.value)} /></Field>
              </div>
              <Field label="Heading"><Textarea rows={2} value={str(values.storyChapter.heading)} onChange={(e) => setGroup("storyChapter", "heading", e.target.value)} /></Field>
            </div>
          </div>

          <div className="studio-card">
            <div className="studio-card__head"><h3>Community chapter</h3><p>The second image section with the “Join the run” call to action.</p></div>
            <div className="studio-card__body">
              <Field label="Image"><SiteImageField value={rel(values.communityChapter.image)} options={siteImages} onChange={(id) => setGroup("communityChapter", "image", id)} label="image" /></Field>
              <Field label="Image description (alt text)"><Input value={str(values.communityChapter.imageAlt)} onChange={(e) => setGroup("communityChapter", "imageAlt", e.target.value)} /></Field>
              <div className="studio-grid studio-grid--2">
                <Field label="Overlay tag"><Input value={str(values.communityChapter.tag)} onChange={(e) => setGroup("communityChapter", "tag", e.target.value)} /></Field>
                <Field label="Call-to-action label"><Input value={str(values.communityChapter.ctaLabel)} onChange={(e) => setGroup("communityChapter", "ctaLabel", e.target.value)} /></Field>
              </div>
              <Field label="Heading"><Input value={str(values.communityChapter.heading)} onChange={(e) => setGroup("communityChapter", "heading", e.target.value)} /></Field>
              <Field label="Body text"><Textarea rows={3} value={str(values.communityChapter.body)} onChange={(e) => setGroup("communityChapter", "body", e.target.value)} /></Field>
            </div>
          </div>
        </>
      )}

      {tab === "contact" && (
        <>
          <div className="studio-card">
            <div className="studio-card__head"><h3>Announcement banner</h3><p>A short notice shown above the homepage header.</p></div>
            <div className="studio-card__body">
              <Toggle label="Show announcement banner" checked={bool(values.announcement.enabled)} onChange={(v) => setGroup("announcement", "enabled", v)} />
              <Field label="Message"><Input value={str(values.announcement.text)} onChange={(e) => setGroup("announcement", "text", e.target.value)} /></Field>
              <div className="studio-grid studio-grid--2">
                <Field label="Link label"><Input value={str(values.announcement.linkLabel)} onChange={(e) => setGroup("announcement", "linkLabel", e.target.value)} /></Field>
                <Field label="Link URL"><Input value={str(values.announcement.linkUrl)} onChange={(e) => setGroup("announcement", "linkUrl", e.target.value)} placeholder="/register or https://…" /></Field>
              </div>
            </div>
          </div>

          <div className="studio-card">
            <div className="studio-card__head"><h3>Contact details</h3></div>
            <div className="studio-card__body">
              <Field label="Contact email"><Input type="email" value={values.contactEmail} onChange={(e) => setValue("contactEmail", e.target.value)} /></Field>
              <div className="studio-grid studio-grid--2">
                <Field label="Primary phone"><Input value={values.primaryPhone} onChange={(e) => setValue("primaryPhone", e.target.value)} /></Field>
                <Field label="Secondary phone"><Input value={values.secondaryPhone} onChange={(e) => setValue("secondaryPhone", e.target.value)} /></Field>
              </div>
              <div className="studio-grid studio-grid--2">
                <Field label="Instagram URL"><Input value={values.instagramUrl} onChange={(e) => setValue("instagramUrl", e.target.value)} placeholder="https://…" /></Field>
                <Field label="Facebook URL"><Input value={values.facebookUrl} onChange={(e) => setValue("facebookUrl", e.target.value)} placeholder="https://…" /></Field>
              </div>
              <Field label="YouTube URL"><Input value={values.youtubeUrl} onChange={(e) => setValue("youtubeUrl", e.target.value)} placeholder="https://…" /></Field>
            </div>
          </div>

          <div className="studio-card">
            <div className="studio-card__head"><h3>Gallery introduction</h3></div>
            <div className="studio-card__body">
              <p className="studio-hint">Shown on the homepage only when no event edition is selected in Galleries. When an edition is set, its name and description are used instead.</p>
              <Field label="Gallery title"><Input value={values.galleryTitle} onChange={(e) => setValue("galleryTitle", e.target.value)} /></Field>
              <Field label="Gallery description"><Textarea rows={2} value={values.galleryDescription} onChange={(e) => setValue("galleryDescription", e.target.value)} /></Field>
            </div>
          </div>
        </>
      )}

      {tab === "seo" && (
        <>
          <div className="studio-card">
            <div className="studio-card__head"><h3>Google listing</h3><p>These fields become the title and snippet on Google. Leave a field empty to keep the recommended official-site copy.</p></div>
            <div className="studio-card__body">
              <Field label="Google title" hint="About 50–60 characters. Include Agomoni Run and Barasat.">
                <Input value={str(values.seo.title)} onChange={(e) => setGroup("seo", "title", e.target.value)} maxLength={70} />
              </Field>
              <Field label="Google description" hint="About 140–160 characters. Mention the official website, date and city.">
                <Textarea rows={3} value={str(values.seo.description)} onChange={(e) => setGroup("seo", "description", e.target.value)} maxLength={180} />
              </Field>
              <Field label="Keywords" hint="Comma-separated. Keep “official Agomoni Run website” in the list.">
                <Textarea rows={2} value={str(values.seo.keywords)} onChange={(e) => setGroup("seo", "keywords", e.target.value)} />
              </Field>
            </div>
          </div>
          <div className="studio-card">
            <div className="studio-card__head"><h3>Social share preview</h3><p>Used when the site is shared on WhatsApp, Facebook or X. The hero photo is the share image.</p></div>
            <div className="studio-card__body">
              <Field label="Share title"><Input value={str(values.seo.ogTitle)} onChange={(e) => setGroup("seo", "ogTitle", e.target.value)} maxLength={90} /></Field>
              <Field label="Share description"><Textarea rows={2} value={str(values.seo.ogDescription)} onChange={(e) => setGroup("seo", "ogDescription", e.target.value)} maxLength={200} /></Field>
            </div>
          </div>
          <div className="studio-card">
            <div className="studio-card__head"><h3>Google Search Console</h3></div>
            <div className="studio-card__body">
              <p className="studio-hint">
                1. Open Google Search Console and add the property https://agomonirun.com
                <br />
                2. Choose HTML-tag verification and paste only the long content code below (not the full meta tag).
                <br />
                3. After Google verifies the site, submit the sitemap: https://agomonirun.com/sitemap.xml
              </p>
              <Field label="Google verification code">
                <Input value={str(values.seo.googleSiteVerification)} onChange={(e) => setGroup("seo", "googleSiteVerification", e.target.value)} placeholder="google-site-verification token" />
              </Field>
            </div>
          </div>
        </>
      )}

      <SaveBar dirty={dirty} saving={saving} onSave={handleSave} />
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="studio-field-row">
      <Label>{label}</Label>
      {children}
      {hint && <span className="studio-hint">{hint}</span>}
    </div>
  );
}

function Toggle({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="studio-field-row">
      <label style={{ display: "flex", alignItems: "center", gap: "0.65rem", cursor: "pointer" }}>
        <Switch checked={checked} onCheckedChange={onChange} />
        <span style={{ fontSize: "0.88rem", fontWeight: 600 }}>{label}</span>
      </label>
      {hint && <span className="studio-hint">{hint}</span>}
    </div>
  );
}

function NativeSelect({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <select
      className="border-input flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}
