import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DestinationStatus } from "@/components/public/destination-status";
import { loadPublicSiteData } from "@/lib/site-data";
import { safeExternalDestination } from "@/lib/redirects";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Register",
  description: "Official registration for Agomoni Run 2.0 by Barasat Runners in Barasat, West Bengal. Use this page on agomonirun.com for the verified registration link.",
  alternates: { canonical: "/register" },
};

export default async function RegisterPage() {
  const { settings } = await loadPublicSiteData();
  const destination = safeExternalDestination(
    settings.registrationUrl,
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
    "/register",
  );
  if (destination) redirect(destination);

  return <DestinationStatus kind="register" settings={settings} />;
}
