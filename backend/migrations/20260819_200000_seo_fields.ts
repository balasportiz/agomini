import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "site_settings"
      ADD COLUMN IF NOT EXISTS "seo_title" varchar,
      ADD COLUMN IF NOT EXISTS "seo_description" varchar,
      ADD COLUMN IF NOT EXISTS "seo_keywords" varchar,
      ADD COLUMN IF NOT EXISTS "seo_og_title" varchar,
      ADD COLUMN IF NOT EXISTS "seo_og_description" varchar,
      ADD COLUMN IF NOT EXISTS "seo_google_site_verification" varchar;
    ALTER TABLE "_site_settings_v"
      ADD COLUMN IF NOT EXISTS "version_seo_title" varchar,
      ADD COLUMN IF NOT EXISTS "version_seo_description" varchar,
      ADD COLUMN IF NOT EXISTS "version_seo_keywords" varchar,
      ADD COLUMN IF NOT EXISTS "version_seo_og_title" varchar,
      ADD COLUMN IF NOT EXISTS "version_seo_og_description" varchar,
      ADD COLUMN IF NOT EXISTS "version_seo_google_site_verification" varchar;
    UPDATE "site_settings"
      SET
        "seo_title" = COALESCE("seo_title", 'Agomoni Run 2.0 | Official website — Barasat Runners'),
        "seo_description" = COALESCE("seo_description", 'Official website of Agomoni Run 2.0, organised by Barasat Runners in Barasat, West Bengal. Community run on 4 October 2026 for World Heart Day. Register, race-day info, gallery and results at agomonirun.com.'),
        "seo_keywords" = COALESCE("seo_keywords", 'Agomoni Run, Agomoni Run 2.0, official Agomoni Run website, Barasat Runners, Barasat marathon, Barasat 10K, Barasat 5K, World Heart Day run, West Bengal running event, agomonirun.com'),
        "seo_og_title" = COALESCE("seo_og_title", 'Agomoni Run 2.0 — Official website | Run For Healthy Heart'),
        "seo_og_description" = COALESCE("seo_og_description", 'The official Agomoni Run website. Organised by Barasat Runners in Barasat, West Bengal. Visit https://agomonirun.com for registration, event-day details, gallery and results.');
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "site_settings"
      DROP COLUMN IF EXISTS "seo_title",
      DROP COLUMN IF EXISTS "seo_description",
      DROP COLUMN IF EXISTS "seo_keywords",
      DROP COLUMN IF EXISTS "seo_og_title",
      DROP COLUMN IF EXISTS "seo_og_description",
      DROP COLUMN IF EXISTS "seo_google_site_verification";
    ALTER TABLE "_site_settings_v"
      DROP COLUMN IF EXISTS "version_seo_title",
      DROP COLUMN IF EXISTS "version_seo_description",
      DROP COLUMN IF EXISTS "version_seo_keywords",
      DROP COLUMN IF EXISTS "version_seo_og_title",
      DROP COLUMN IF EXISTS "version_seo_og_description",
      DROP COLUMN IF EXISTS "version_seo_google_site_verification";
  `)
}
