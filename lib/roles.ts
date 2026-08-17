import type { User } from "@/payload-types";

/**
 * Role tiers, ordered from least to most privileged.
 *
 * The underlying stored value for the top tier stays "admin" for backward
 * compatibility with the existing enum_users_role Postgres type and any
 * already-seeded administrator accounts. Only the admin-facing label changed
 * to "Super Admin".
 */
export const ROLE_VALUES = ["media-manager", "editor", "admin"] as const;
export type Role = (typeof ROLE_VALUES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Super Admin",
  editor: "Editor",
  "media-manager": "Media Manager",
};

export const ROLE_OPTIONS = ROLE_VALUES.map((value) => ({ label: ROLE_LABELS[value], value }));

const ROLE_RANK: Record<Role, number> = {
  "media-manager": 0,
  editor: 1,
  admin: 2,
};

function roleOf(user: unknown): Role | null {
  if (!user || typeof user !== "object") return null;
  const role = (user as { role?: unknown }).role;
  return typeof role === "string" && ROLE_VALUES.includes(role as Role) ? (role as Role) : null;
}

/** True if the given user's role meets or exceeds the required tier. */
export function hasMinimumRole(user: unknown, minimum: Role): boolean {
  const role = roleOf(user);
  if (!role) return false;
  return ROLE_RANK[role] >= ROLE_RANK[minimum];
}

export const isSuperAdmin = (user: unknown): boolean => roleOf(user) === "admin";
export const isEditorOrAbove = (user: unknown): boolean => hasMinimumRole(user, "editor");
export const isMediaManagerOrAbove = (user: unknown): boolean => hasMinimumRole(user, "media-manager");

export type { User };
