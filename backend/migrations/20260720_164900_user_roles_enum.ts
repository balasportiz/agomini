import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

// Split out from the rest of the "admin overhaul" migration on purpose:
// Postgres does not allow a newly-added enum value to be referenced (e.g. in
// a column DEFAULT) within the same transaction that added it, and Payload
// runs each migration file's up() inside one transaction. Adding the values
// here first, as their own committed migration, lets the next migration
// safely set "role" DEFAULT 'editor'.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TYPE "public"."enum_users_role" ADD VALUE 'media-manager' BEFORE 'admin';
    ALTER TYPE "public"."enum_users_role" ADD VALUE 'editor' BEFORE 'admin';
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Removing enum values requires rebuilding the type; any existing
  // "editor"/"media-manager" rows are re-pointed to "admin" first so the
  // rebuild never fails on a value that's about to be dropped.
  await db.execute(sql`
    ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE text;
    UPDATE "users" SET "role" = 'admin' WHERE "role" IN ('editor', 'media-manager');
    ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'admin'::text;
    DROP TYPE "public"."enum_users_role";
    CREATE TYPE "public"."enum_users_role" AS ENUM('admin');
    ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'admin'::"public"."enum_users_role";
    ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE "public"."enum_users_role" USING "role"::"public"."enum_users_role";
  `)
}
