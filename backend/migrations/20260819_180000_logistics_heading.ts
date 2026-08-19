import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "site_settings"
      ADD COLUMN IF NOT EXISTS "logistics_heading" varchar,
      ADD COLUMN IF NOT EXISTS "logistics_subheading" varchar;
    ALTER TABLE "_site_settings_v"
      ADD COLUMN IF NOT EXISTS "version_logistics_heading" varchar,
      ADD COLUMN IF NOT EXISTS "version_logistics_subheading" varchar;
    UPDATE "site_settings"
      SET "logistics_heading" = 'Event day info',
          "logistics_subheading" = 'Race-day arrival and bib-collection details.'
      WHERE "logistics_heading" IS NULL;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "site_settings"
      DROP COLUMN IF EXISTS "logistics_heading",
      DROP COLUMN IF EXISTS "logistics_subheading";
    ALTER TABLE "_site_settings_v"
      DROP COLUMN IF EXISTS "version_logistics_heading",
      DROP COLUMN IF EXISTS "version_logistics_subheading";
  `)
}
