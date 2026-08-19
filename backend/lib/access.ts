import type { Access, FieldAccess, GlobalConfig } from "payload";
import { hasMinimumRole, isSuperAdmin, type Role } from "@/lib/roles";

export const authenticated: Access = ({ req: { user } }) => Boolean(user);
export const authenticatedField: FieldAccess = ({ req: { user } }) => Boolean(user);
export const publicRead: Access = () => true;

export const publicReadActive: Access = ({ req: { user } }) => {
  if (user) return true;
  return { active: { equals: true } };
};

/** Editions can be public on the gallery, the results archive, or both. */
export const publicReadEdition: Access = ({ req: { user } }) => {
  if (user) return true;
  return {
    or: [{ active: { equals: true } }, { showInResults: { equals: true } }],
  };
};

export const publicGlobalRead: NonNullable<GlobalConfig["access"]>["read"] = () => true;
export const authenticatedGlobal: NonNullable<GlobalConfig["access"]>["update"] = ({ req }) =>
  Boolean(req.user);

/**
 * Role-aware access control, layered on top of the plain-authenticated
 * helpers above. Content collections/globals should prefer these so that
 * "Media Manager" accounts can't edit event copy and "Editor" accounts can't
 * manage other user accounts.
 */

/** Any signed-in user of at least `minimum` role may perform the operation. */
export const minimumRole =
  (minimum: Role): Access =>
  ({ req: { user } }) =>
    hasMinimumRole(user, minimum);

/** Editors and Super Admins can manage event/content collections and globals. */
export const editorOrAbove = minimumRole("editor");

/** Media Managers, Editors and Super Admins can manage the media library. */
export const mediaManagerOrAbove = minimumRole("media-manager");

/** Only Super Admins may manage other user accounts. */
export const superAdminOnly: Access = ({ req: { user } }) => isSuperAdmin(user);

/** Field-level equivalent of `superAdminOnly` (e.g. for a role select field). */
export const superAdminOnlyField: FieldAccess = ({ req: { user } }) => isSuperAdmin(user);

/** Global equivalent of `editorOrAbove`, for Global `update` access. */
export const editorOrAboveGlobal: NonNullable<GlobalConfig["access"]>["update"] = ({ req }) =>
  hasMinimumRole(req.user, "editor");
