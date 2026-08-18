import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "site_settings"
      ADD COLUMN IF NOT EXISTS "show_registration_cta" boolean DEFAULT true NOT NULL,
      ADD COLUMN IF NOT EXISTS "show_results_cta" boolean DEFAULT false NOT NULL;
    ALTER TABLE "_site_settings_v"
      ADD COLUMN IF NOT EXISTS "version_show_registration_cta" boolean DEFAULT true NOT NULL,
      ADD COLUMN IF NOT EXISTS "version_show_results_cta" boolean DEFAULT false NOT NULL;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "site_settings"
      DROP COLUMN IF EXISTS "show_registration_cta",
      DROP COLUMN IF EXISTS "show_results_cta";
    ALTER TABLE "_site_settings_v"
      DROP COLUMN IF EXISTS "version_show_registration_cta",
      DROP COLUMN IF EXISTS "version_show_results_cta";
  `)
}
