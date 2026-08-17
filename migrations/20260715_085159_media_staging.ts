import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "media" ALTER COLUMN "alt_text" DROP NOT NULL;
  ALTER TABLE "media" ALTER COLUMN "active" SET DEFAULT false;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   UPDATE "media" SET "alt_text" = '' WHERE "alt_text" IS NULL;
  ALTER TABLE "media" ALTER COLUMN "alt_text" SET NOT NULL;
  ALTER TABLE "media" ALTER COLUMN "active" SET DEFAULT true;`)
}
