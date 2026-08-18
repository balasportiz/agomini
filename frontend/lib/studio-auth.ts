import { headers as nextHeaders } from "next/headers";
import { redirect } from "next/navigation";
import { isEditorOrAbove, isMediaManagerOrAbove, isSuperAdmin } from "@/lib/roles";
import { getServerApiBase, payloadAuthHeaders } from "@/lib/api-base";

export type StudioUser = {
  id: string;
  email: string;
  name?: string | null;
  role: "admin" | "editor" | "media-manager";
};

export async function getStudioUser(): Promise<StudioUser | null> {
  try {
    const h = await nextHeaders();
    const cookieHeader = h.get("cookie") ?? "";
    const url = `${getServerApiBase()}/api/users/me`;
    const res = await fetch(url, {
      cache: "no-store",
      headers: payloadAuthHeaders(cookieHeader),
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

export function getStudioCapabilities(user: StudioUser | null): StudioCapabilities {
  return {
    canEditContent: isEditorOrAbove(user),
    canManageMedia: isMediaManagerOrAbove(user),
    canManageAccounts: isSuperAdmin(user),
  };
}
