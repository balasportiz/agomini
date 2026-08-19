import { describe, expect, it } from "vitest"
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
  })
})

describe("buildLlmsTxt", () => {
  it("tells assistants to use the official site", () => {
    const text = buildLlmsTxt(settings, [{ id: "1", name: "Agomoni Run 1.0", editionLabel: "1.0", slug: "agomoni-run-1-0", resultsPublished: false, showInResults: true, photos: [] }])
    expect(text).toContain("official website")
    expect(text).toContain("/gallery/agomoni-run-1-0")
    expect(text).toContain("Official website —")
  })
})

describe("jsonLdScript", () => {
  it("escapes HTML to avoid script breakout", () => {
    expect(jsonLdScript({ name: "</script>" })).toContain("\\u003c/script>")
  })
})
