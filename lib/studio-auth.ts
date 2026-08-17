import { headers as nextHeaders } from "next/headers";
import { redirect } from "next/navigation";
import { isEditorOrAbove, isMediaManagerOrAbove, isSuperAdmin } from "@/lib/roles";

/**
 * Minimal user shape returned by GET /api/users/me.
 * Mirrors the `User` type from payload-types.ts without importing payload-types
 * (which would pull in Payload's full type graph).
 */
export type StudioUser = {
  id: string;
  email: string;
  name?: string | null;
  role: "admin" | "editor" | "media-manager";
};

function getApiBase(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return raw.replace(/\/$/, "");
}

/**
 * Resolves the currently signed-in Studio user from the Payload auth cookie
 * via GET /api/users/me. Returns null when nobody is signed in.
 */
export async function getStudioUser(): Promise<StudioUser | null> {
  try {
    const h = await nextHeaders();
    const cookieHeader = h.get("cookie") ?? "";
    const url = `${getApiBase()}/api/users/me`;
    const res = await fetch(url, {
      cache: "no-store",
      headers: { Cookie: cookieHeader },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { user?: StudioUser | null };
    const user = data?.user ?? null;
    if (!user || typeof user.id !== "string") return null;
    return user;
  } catch {
    return null;
  }
}

/** Redirects to the Studio login screen unless a user is signed in. */
export async function requireStudioUser(): Promise<StudioUser> {
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
export function getStudioCapabilities(user: StudioUser | null): StudioCapabilities {
  return {
    canEditContent: isEditorOrAbove(user),
    canManageMedia: isMediaManagerOrAbove(user),
    canManageAccounts: isSuperAdmin(user),
  };
}
