import { getPayload } from "payload";
import config from "@payload-config";

const email = process.env.FIRST_ADMIN_EMAIL ?? "admin@agomonirun.com";
const password = process.env.FIRST_ADMIN_PASSWORD;
const name = process.env.FIRST_ADMIN_NAME ?? "Admin";

if (!password) {
  throw new Error("Set FIRST_ADMIN_PASSWORD before running this script.");
}

const payload = await getPayload({ config });
const existing = await payload.find({
  collection: "users",
  depth: 0,
  limit: 1,
  overrideAccess: true,
});

if (existing.totalDocs > 0) {
  const current = existing.docs[0];
  console.log(`A Studio user already exists (${current?.email}). Sign in with that account.`);
  process.exit(0);
}

const user = await payload.create({
  collection: "users",
  overrideAccess: true,
  data: {
    email,
    password,
    name,
    role: "admin",
  },
});

console.log(`Created Super Admin ${user.email}. Sign in at /studio/login.`);
process.exit(0);
