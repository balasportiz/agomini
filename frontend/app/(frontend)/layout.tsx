import type { Metadata } from "next";
import { Barlow, Barlow_Condensed, Noto_Sans_Bengali } from "next/font/google";
import type { ReactNode } from "react";
import { AnnouncementBanner } from "@/components/public/announcement-banner";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { LivePreviewRefresh } from "@/components/public/live-preview-refresh";
import { LiveUpdates } from "@/components/public/live-updates";
import { loadPublicSiteData } from "@/lib/site-data";
import "../globals.css";

const bodyFont = Barlow({ subsets: ["latin"], variable: "--font-body", weight: ["400", "500", "600", "700"] });
const displayFont = Barlow_Condensed({ subsets: ["latin"], variable: "--font-display", weight: ["500", "600", "700", "800"] });
const bengaliFont = Noto_Sans_Bengali({ subsets: ["bengali"], variable: "--font-bengali", weight: ["500", "700"] });
const siteUrl = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: { default: "Agomoni Run 2.0 | Barasat Runners", template: "%s | Agomoni Run 2.0" },
  description: "Agomoni Run 2.0 brings Barasat together on 4 October 2026 for World Heart Day — movement, community and heart health.",
  applicationName: "Agomoni Run 2.0",
  alternates: { canonical: "/" },
  keywords: ["Agomoni Run", "Barasat Runners", "Barasat marathon", "running event West Bengal", "World Heart Day run", "heart health run"],
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "/",
    siteName: "Agomoni Run 2.0",
    title: "Agomoni Run 2.0 — Run For Healthy Heart",
    description: "Join Barasat Runners on Sunday, 4 October 2026 for a community run celebrating World Heart Day — movement, community and heart health.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Agomoni Run 2.0",
    description: "Run For Healthy Heart. Barasat · 4 October 2026.",
  },
  icons: { icon: "/icon.svg", apple: "/apple-icon.png" },
};

export default async function FrontendLayout({ children }: Readonly<{ children: ReactNode }>) {
  const { settings, navigation } = await loadPublicSiteData();

  return (
    <html lang="en">
      <body className={`${bodyFont.variable} ${displayFont.variable} ${bengaliFont.variable}`}>
        <LivePreviewRefresh />
        <LiveUpdates />
        <SiteHeader settings={settings} links={navigation.headerLinks} />
        <AnnouncementBanner announcement={settings.announcement} />
        {children}
        <SiteFooter settings={settings} links={navigation.footerLinks} />
      </body>
    </html>
  );
}
