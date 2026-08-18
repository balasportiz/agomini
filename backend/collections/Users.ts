import type { Access, CollectionConfig } from "payload";
import { superAdminOnly, superAdminOnlyField } from "@/lib/access";
import { isSuperAdmin, ROLE_LABELS, ROLE_OPTIONS } from "@/lib/roles";

/**
 * Any signed-in user may read the account list so relationships (e.g. Media's
 * "uploadedBy") resolve, but Editors/Media Managers only ever see their own
 * document. Super Admins see everyone.
 */
const readUsers: Access = ({ req: { user } }) => {
  if (!user) return false;
  if (isSuperAdmin(user)) return true;
  return { id: { equals: user.id } };
};

/** Super Admins can edit anyone; everyone else can only edit their own account. */
const updateUsers: Access = ({ req: { user }, id }) => {
  if (!user) return false;
  if (isSuperAdmin(user)) return true;
  return Boolean(id) && user.id === id;
};

/** Super Admins can delete anyone; everyone else can only delete their own account. */
const deleteUsers: Access = ({ req: { user }, id }) => {
  if (!user) return false;
  if (isSuperAdmin(user)) return true;
  return Boolean(id) && user.id === id;
};

export const Users: CollectionConfig = {
  slug: "users",
  labels: { singular: "Account", plural: "Accounts" },
  disableBulkEdit: true,
  admin: {
    group: "Administration",
    useAsTitle: "email",
    defaultColumns: ["email", "name", "role", "updatedAt"],
    description:
      "Admin panel accounts. Only Super Admins can create new accounts or change roles. Public sign-up is disabled — the only exception is Payload's own first-account setup screen when no accounts exist yet.",
  },
  access: {
    // Payload automatically bypasses this for the very first account created
    // (the admin panel's built-in "create first user" bootstrap screen), so
    // this only governs every account created after that.
    create: superAdminOnly,
    read: readUsers,
    update: updateUsers,
    delete: deleteUsers,
    admin: ({ req }) => Boolean(req.user),
  },
  hooks: {
    beforeDelete: [
      async ({ req, id }) => {
        const target = await req.payload.findByID({ collection: "users", id, overrideAccess: true }).catch(() => null);
        if (!target || target.role !== "admin") return;

        const remainingAdmins = await req.payload.count({
          collection: "users",
          overrideAccess: true,
          where: { role: { equals: "admin" }, id: { not_equals: id } },
        });
        if (remainingAdmins.totalDocs === 0) {
          throw new Error(`Cannot delete the last ${ROLE_LABELS.admin} account. Promote another account first.`);
        }
      },
    ],
  },
  auth: {
    maxLoginAttempts: 5,
    lockTime: 10 * 60 * 1000,
    tokenExpiration: 8 * 60 * 60,
    cookies: {
      sameSite: "Lax",
      secure: process.env.NODE_ENV === "production",
    },
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
      maxLength: 100,
    },
    {
      name: "role",
      type: "select",
      defaultValue: "editor",
      required: true,
      options: ROLE_OPTIONS,
      admin: {
        description:
          "Super Admin: full control including accounts. Editor: full content editing (settings, categories, highlights, FAQs, sponsors, navigation). Media Manager: gallery/media only.",
      },
      access: { update: superAdminOnlyField },
    },
  ],
  versions: false,
};
