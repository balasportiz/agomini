import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DestinationStatus } from "@/components/public/destination-status";
import { loadPublicSiteData } from "@/lib/site-data";
import { safeExternalDestination } from "@/lib/redirects";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Register",
  description: "Registration information for Agomoni Run 2.0 in Barasat.",
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
