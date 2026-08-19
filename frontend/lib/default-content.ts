export const CONTENT_BOOTSTRAP_VERSION = 4;

export const defaultSiteSettings = {
  eventName: "Agomoni Run 2.0",
  tagline: "Run For Healthy Heart",
  eventDateTime: "2026-10-04T00:30:00.000Z",
  timingConfirmed: false,
  timezone: "Asia/Kolkata",
  venue: "Barasat, Subhash Maidan, West Bengal",
  organiserName: "Barasat Runners",
  organiserDescription: "A community of runners bringing Barasat together through movement, wellbeing and a shared commitment to heart health.",
  heroHeading: "Run For Healthy Heart",
  heroSubheading: "As Bengal prepares to welcome Maa Durga, Barasat comes together for World Heart Day — a celebration of movement, community and heart health.",
  registrationStatus: "soon" as const,
  showRegistrationCta: true,
  showResultsCta: false,
  about: "Agomoni Run brings runners and the local community together in Barasat, combining the energy of road running with Bengal’s Agomoni spirit. This year, in step with World Heart Day, every stride celebrates movement, wellbeing and the shared promise to keep our hearts healthy and strong.",
  announcement: { enabled: false },
  galleryTitle: "The Agomoni Run gallery",
  galleryDescription: "Moments of movement, solidarity and celebration from our community and past editions.",
  logisticsHeading: "Event day info",
  logisticsSubheading: "Race-day arrival and bib-collection details.",
  seo: {
    title: "Agomoni Run 2026 | Official Site — Barasat, Kolkata",
    description:
      "Official website of Agomoni Run 2.0 by Barasat Runners. 3K, 5K, 10K and 15K community races in Barasat, Kolkata on 4 October 2026. Register, race-day info, gallery and results at agomonirun.com.",
    keywords:
      "Agomoni Run, Agomoni Run 2026, Agomoni Run 2.0, Agomoni Run Barasat, Agomoni Run Kolkata, Agomoni Run registration, official Agomoni Run website, Barasat Runners, Barasat 5K, Barasat 10K, Barasat 15K, 3K fun run Barasat, Subhash Maidan, World Heart Day run, Durga Puja run Barasat, West Bengal marathon",
    ogTitle: "Agomoni Run 2026 (2.0) — Official website | Barasat Runners",
    ogDescription:
      "The official Agomoni Run website. 3K, 5K, 10K and 15K in Barasat, Kolkata on 4 October 2026, organised by Barasat Runners. Visit agomonirun.com to register.",
    googleSiteVerification: "",
  },
  heroManifesto: {
    bengaliWord: "একসাথে",
    line1: "Run for a healthy heart.",
    line2: "Don’t miss a beat.",
    wordmarkTop: "AGOMONI",
    wordmarkBottom: "RUN",
    wordmarkYear: "2.0",
    routeLineStart: "BARASAT",
    routeLineEnd: "04 \u00b7 10 \u00b7 26",
  },
  aboutBengaliWord: "আগমনী",
  aboutHeading: "More than a finish line.",
  storyChapter: {
    word: "HEARTBEAT",
    lead: "Every stride carries a message.",
    heading: "A healthy heart is not a finish line. It is a rhythm we keep for life.",
    imageAlt: "Runners moving together on an open road",
  },
  communityChapter: {
    tag: "MOVE \u00b7 WELCOME \u00b7 THRIVE",
    heading: "Barasat runs together.",
    body: "We welcome Maa Durga through movement, healthy habits and the strength of a community that keeps every heart beating strong.",
    ctaLabel: "Join the run",
    imageAlt: "A runner training on a quiet road at dawn",
  },
};

export const defaultHeaderLinks = [
  { label: "Home", href: "/#home" },
  { label: "Categories", href: "/#categories" },
  { label: "About", href: "/#about" },
  { label: "Highlights", href: "/#highlights" },
  { label: "Gallery", href: "/gallery" },
  { label: "FAQ", href: "/#faq" },
  { label: "Contact", href: "/#contact" },
];

export const defaultFooterLinks = [
  { label: "Categories", href: "/#categories" },
  { label: "Event day", href: "/#event-logistics" },
  { label: "About", href: "/#about" },
  { label: "Gallery", href: "/gallery" },
  { label: "Results", href: "/result" },
  { label: "FAQ", href: "/#faq" },
];

export const defaultFaqs = [
  { question: "How do I register?", answer: "Use any Register button on this website. The official registration destination will open when registration is available.", active: true },
  { question: "When will race-day details be confirmed?", answer: "Category times, eligibility, inclusions and collection details will be published after confirmation by the organisers.", active: true },
];

export const defaultRaceCategories = [
  { name: "5K", distance: "5 kilometres", fee: "To be announced", reportingTime: "To be announced", startTime: "To be announced", description: "An accessible city run for runners beginning their race-day journey and community members moving together for a healthier heart.", inclusions: [{ item: "Final inclusions will be confirmed before registration opens" }], active: true },
  { name: "10K", distance: "10 kilometres", fee: "To be announced", reportingTime: "To be announced", startTime: "To be announced", description: "A focused road-running challenge through Barasat, carrying a collective message of movement, wellbeing and heart health.", inclusions: [{ item: "Final inclusions will be confirmed before registration opens" }], active: true },
  { name: "15K", distance: "15 kilometres", fee: "To be announced", reportingTime: "To be announced", startTime: "To be announced", description: "The longest Agomoni Run category for experienced runners ready to sustain the event’s message across every kilometre.", inclusions: [{ item: "Final inclusions will be confirmed before registration opens" }], active: true },
];