import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Barlow, Barlow_Condensed, Noto_Sans_Bengali } from "next/font/google";
import { AnnouncementBanner } from "@/components/public/announcement-banner";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { LivePreviewRefresh } from "@/components/public/live-preview-refresh";
import { LiveUpdates } from "@/components/public/live-updates";
import { loadPublicSiteData } from "@/lib/site-data";
import { absoluteUrl, publicSiteUrl, resolveSeo } from "@/lib/seo";
import "../globals.css";

const bodyFont = Barlow({ subsets: ["latin"], variable: "--font-body", weight: ["400", "500", "600", "700"] });
const displayFont = Barlow_Condensed({ subsets: ["latin"], variable: "--font-display", weight: ["500", "600", "700", "800"] });
const bengaliFont = Noto_Sans_Bengali({ subsets: ["bengali"], variable: "--font-bengali", weight: ["500", "700"] });

export async function generateMetadata(): Promise<Metadata> {
  const { settings } = await loadPublicSiteData();
  const seo = resolveSeo(settings);
  const siteUrl = publicSiteUrl();
  const ogImage = settings.heroPhoto?.url ? absoluteUrl(settings.heroPhoto.url) : undefined;
  const keywords = seo.keywords.split(",").map((item) => item.trim()).filter(Boolean);
  return {
    metadataBase: new URL(siteUrl),
    title: { default: seo.title, template: `%s | ${settings.eventName}` },
    description: seo.description,
    applicationName: settings.eventName,
    authors: [{ name: settings.organiserName, url: siteUrl }],
    creator: settings.organiserName,
    publisher: settings.organiserName,
    category: "sports",
    keywords,
    alternates: {
      canonical: "/",
      languages: { "en-IN": "/", "x-default": "/" },
    },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
    verification: seo.googleSiteVerification ? { google: seo.googleSiteVerification } : undefined,
    openGraph: {
      type: "website",
      locale: "en_IN",
      url: "/",
      siteName: settings.eventName,
      title: seo.ogTitle,
      description: seo.ogDescription,
      ...(ogImage ? { images: [{ url: ogImage, alt: settings.heroPhoto?.altText || settings.eventName }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: seo.ogTitle,
      description: seo.ogDescription,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
    icons: { icon: "/icon.svg", apple: "/apple-icon.png" },
  };
}

export default async function FrontendLayout({ children }: Readonly<{ children: ReactNode }>) {
  const { settings, navigation } = await loadPublicSiteData();

  return (
    <html lang="en-IN">
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
