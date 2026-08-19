import { describe, expect, it, vi } from "vitest"
import { defaultSiteSettings } from "@/lib/default-content"
import { buildLlmsTxt, jsonLdScript, resolveSeo } from "@/lib/seo"
import type { PublicSettings } from "@/lib/site-data"

const settings = {
  ...defaultSiteSettings,
  highlights: [],
  faqs: [{ question: "How do I register?", answer: "Use any Register button on this website.", active: true }],
  sponsors: [],
  storyChapter: { ...defaultSiteSettings.storyChapter, image: null },
  communityChapter: { ...defaultSiteSettings.communityChapter, image: null },
} as PublicSettings

describe("resolveSeo", () => {
  it("falls back to official-site defaults", () => {
    const seo = resolveSeo({ ...settings, seo: { ...defaultSiteSettings.seo, title: "  " } })
    expect(seo.title).toContain("Agomoni Run")
    expect(seo.description.toLowerCase()).toContain("official")
    expect(seo.description.toLowerCase()).toContain("railway")
    expect(seo.keywords).toContain("Agomoni Run Barasat")
  })

  it("replaces the old official-site title", () => {
    const seo = resolveSeo({
      ...settings,
      seo: { ...defaultSiteSettings.seo, title: "Agomoni Run 2026 | Official Site — Barasat, Kolkata" },
    })
    expect(seo.title).toContain("running event")
  })
})

describe("buildLlmsTxt", () => {
  it("tells assistants to use the official site", () => {
    const text = buildLlmsTxt(settings, [{ id: "1", name: "Agomoni Run 1.0", editionLabel: "1.0", slug: "agomoni-run-1-0", resultsPublished: false, showInResults: true, photos: [] }])
    expect(text).toContain("Agomoni Run Barasat")
    expect(text).toContain("railway station")
    expect(text).toContain("MarathonMitra")
    expect(text).toContain("/gallery/agomoni-run-1-0")
    expect(text).toContain("Official website —")
  })
})

describe("publicSiteUrl", () => {
  it("uses www so Google can fetch the sitemap without a 308", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://agomonirun.com")
    vi.resetModules()
    const { publicSiteUrl: url } = await import("@/lib/seo")
    expect(url()).toBe("https://www.agomonirun.com")
    vi.unstubAllEnvs()
    vi.resetModules()
  })
})
