import { headers as nextHeaders } from "next/headers";
import { redirect } from "next/navigation";
import { getPayload } from "payload";
import config from "@payload-config";
import type { User } from "@/payload-types";
import { isEditorOrAbove, isMediaManagerOrAbove, isSuperAdmin } from "@/lib/roles";

/**
 * Resolves the currently signed-in Studio user from the Payload auth cookie.
 * Returns null when nobody is signed in (or on any auth error) so callers can
 * redirect to the login screen.
 */
export async function getStudioUser(): Promise<User | null> {
  try {
    const payload = await getPayload({ config });
    const requestHeaders = await nextHeaders();
    const result = await payload.auth({ headers: requestHeaders });
    return (result?.user as User | null) ?? null;
  } catch {
    return null;
  }
}

/** Redirects to the Studio login screen unless a user is signed in. */
export async function requireStudioUser(): Promise<User> {
  const user = await getStudioUser();
  if (!user) redirect("/studio/login");
  return user;
}

export type StudioCapabilities = {
  canEditContent: boolean;
  canManageMedia: boolean;
  canManageAccounts: boolean;
};

/** Maps a user's role to what they're allowed to do in the Studio. */
export function getStudioCapabilities(user: User | null): StudioCapabilities {
  return {
    canEditContent: isEditorOrAbove(user),
    canManageMedia: isMediaManagerOrAbove(user),
    canManageAccounts: isSuperAdmin(user),
  };
}
