import { headers as nextHeaders } from "next/headers";
import { redirect } from "next/navigation";
import { isEditorOrAbove, isMediaManagerOrAbove, isSuperAdmin } from "@/lib/roles";
import { getServerApiBase } from "@/lib/api-base";

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
  return getServerApiBase();
}

/**
 * Resolves the currently signed-in Studio user.
 * On Render, read the JWT locally via Payload (no HTTP self-fetch).
 * On Vercel, call Render's GET /api/users/me with the forwarded cookie.
 */
export async function getStudioUser(): Promise<StudioUser | null> {
  try {
    if (!process.env.VERCEL) {
      const { getPayload } = await import("payload");
      const { default: config } = await import("@payload-config");
      const payload = await getPayload({ config });
      const h = await nextHeaders();
      const { user } = await payload.auth({ headers: h });
      if (!user || typeof user.id !== "string") return null;
      const role = user.role === "admin" || user.role === "editor" || user.role === "media-manager" ? user.role : "editor";
      return {
        id: user.id,
        email: typeof user.email === "string" ? user.email : "",
        name: typeof user.name === "string" ? user.name : null,
        role,
      };
    }

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
