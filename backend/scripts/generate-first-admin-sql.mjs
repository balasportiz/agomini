import crypto from "node:crypto";
import fs from "node:fs";

const email = process.env.FIRST_ADMIN_EMAIL ?? "admin@agomonirun.com";
const password = process.env.FIRST_ADMIN_PASSWORD;
const name = process.env.FIRST_ADMIN_NAME ?? "Admin";

if (!password) {
  throw new Error("Set FIRST_ADMIN_PASSWORD");
}

const salt = crypto.randomBytes(32).toString("hex");
const hash = crypto.pbkdf2Sync(password, salt, 25000, 512, "sha256").toString("hex");

function pgString(value) {
  return `'${value.replaceAll("'", "''")}'`;
}

const sql = `-- Supabase SQL Editor: paste and Run.
-- Then sign in at /studio/login with ${email} and the password you set.

INSERT INTO public.users (
  id, name, role, email, salt, hash, login_attempts, updated_at, created_at
)
SELECT
  gen_random_uuid(),
  ${pgString(name)},
  'admin',
  ${pgString(email)},
  ${pgString(salt)},
  ${pgString(hash)},
  0,
  now(),
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.users WHERE email = ${pgString(email)}
);
`;

fs.writeFileSync("scripts/create-first-admin.sql", sql);
console.log("Wrote scripts/create-first-admin.sql");
