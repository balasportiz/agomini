import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AccountsManager } from "@/components/studio/accounts-manager";
import { getStudioCapabilities, requireStudioUser } from "@/lib/studio-auth";
import { loadAccounts } from "@/lib/studio-data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Accounts" };

export default async function StudioAccountsPage() {
  const user = await requireStudioUser();
  if (!getStudioCapabilities(user).canManageAccounts) notFound();

  const accounts = await loadAccounts();
  return <AccountsManager initialAccounts={accounts} currentUserId={String(user.id)} />;
}
