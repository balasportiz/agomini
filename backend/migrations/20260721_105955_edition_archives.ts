import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_media_asset_type" AS ENUM('event-gallery', 'site', 'partner');
  CREATE TABLE "event_editions" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"name" varchar NOT NULL,
  	"edition_label" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"event_date" timestamp(3) with time zone,
  	"gallery_description" varchar,
  	"results_url" varchar,
  	"results_published" boolean DEFAULT false NOT NULL,
  	"active" boolean DEFAULT false NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "media" ADD COLUMN "asset_type" "enum_media_asset_type" DEFAULT 'site' NOT NULL;
  ALTER TABLE "media" ADD COLUMN "gallery_edition_id" uuid;
  ALTER TABLE "media" ADD COLUMN "show_in_gallery" boolean DEFAULT false NOT NULL;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "event_editions_id" uuid;
  ALTER TABLE "site_settings" ADD COLUMN "featured_gallery_edition_id" uuid;
  ALTER TABLE "_site_settings_v" ADD COLUMN "version_featured_gallery_edition_id" uuid;

  -- Preserve the existing 1.0 gallery while separating website artwork and
  -- partner logos from event photographs. The archive date stays empty
  -- because no verified historical date is available in the current data.
  INSERT INTO "event_editions" (
    "id", "name", "edition_label", "slug", "gallery_description",
    "results_url", "results_published", "active"
  )
  SELECT
    gen_random_uuid(),
    'Agomoni Run 1.0',
    '1.0',
    'agomoni-run-1-0',
    NULLIF("gallery_description", ''),
    NULLIF("results_url", ''),
    CASE WHEN NULLIF("results_url", '') IS NOT NULL THEN true ELSE false END,
    true
  FROM "site_settings"
  LIMIT 1;

  -- A global might not yet have a row on a newly provisioned database.
  INSERT INTO "event_editions" ("id", "name", "edition_label", "slug", "active")
  SELECT gen_random_uuid(), 'Agomoni Run 1.0', '1.0', 'agomoni-run-1-0', true
  WHERE NOT EXISTS (SELECT 1 FROM "event_editions" WHERE "slug" = 'agomoni-run-1-0');

  UPDATE "media"
  SET "asset_type" = 'partner', "show_in_gallery" = false
  WHERE "id" IN (SELECT "logo_id" FROM "sponsors" WHERE "logo_id" IS NOT NULL);

  UPDATE "media"
  SET "asset_type" = 'site', "show_in_gallery" = false
  WHERE "id" IN (
    SELECT "hero_photo_id" FROM "site_settings" WHERE "hero_photo_id" IS NOT NULL
    UNION SELECT "story_chapter_image_id" FROM "site_settings" WHERE "story_chapter_image_id" IS NOT NULL
    UNION SELECT "community_chapter_image_id" FROM "site_settings" WHERE "community_chapter_image_id" IS NOT NULL
    UNION SELECT "photo_id" FROM "highlights" WHERE "photo_id" IS NOT NULL
  );

  UPDATE "media"
  SET
    "asset_type" = 'event-gallery',
    "gallery_edition_id" = (SELECT "id" FROM "event_editions" WHERE "slug" = 'agomoni-run-1-0'),
    "show_in_gallery" = "active"
  WHERE "asset_type" = 'site'
    AND "id" NOT IN (SELECT "logo_id" FROM "sponsors" WHERE "logo_id" IS NOT NULL)
    AND "id" NOT IN (
      SELECT "hero_photo_id" FROM "site_settings" WHERE "hero_photo_id" IS NOT NULL
      UNION SELECT "story_chapter_image_id" FROM "site_settings" WHERE "story_chapter_image_id" IS NOT NULL
      UNION SELECT "community_chapter_image_id" FROM "site_settings" WHERE "community_chapter_image_id" IS NOT NULL
      UNION SELECT "photo_id" FROM "highlights" WHERE "photo_id" IS NOT NULL
    );

  UPDATE "site_settings"
  SET "featured_gallery_edition_id" = (SELECT "id" FROM "event_editions" WHERE "slug" = 'agomoni-run-1-0')
  WHERE "featured_gallery_edition_id" IS NULL;

  CREATE UNIQUE INDEX "event_editions_slug_idx" ON "event_editions" USING btree ("slug");
  CREATE INDEX "event_editions_active_idx" ON "event_editions" USING btree ("active");
  CREATE INDEX "event_editions_updated_at_idx" ON "event_editions" USING btree ("updated_at");
  CREATE INDEX "event_editions_created_at_idx" ON "event_editions" USING btree ("created_at");
  ALTER TABLE "media" ADD CONSTRAINT "media_gallery_edition_id_event_editions_id_fk" FOREIGN KEY ("gallery_edition_id") REFERENCES "public"."event_editions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_event_editions_fk" FOREIGN KEY ("event_editions_id") REFERENCES "public"."event_editions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_featured_gallery_edition_id_event_editions_id_fk" FOREIGN KEY ("featured_gallery_edition_id") REFERENCES "public"."event_editions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_site_settings_v" ADD CONSTRAINT "_site_settings_v_version_featured_gallery_edition_id_event_editions_id_fk" FOREIGN KEY ("version_featured_gallery_edition_id") REFERENCES "public"."event_editions"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "media_asset_type_idx" ON "media" USING btree ("asset_type");
  CREATE INDEX "media_gallery_edition_idx" ON "media" USING btree ("gallery_edition_id");
  CREATE INDEX "media_show_in_gallery_idx" ON "media" USING btree ("show_in_gallery");
  CREATE INDEX "payload_locked_documents_rels_event_editions_id_idx" ON "payload_locked_documents_rels" USING btree ("event_editions_id");
  CREATE INDEX "site_settings_featured_gallery_edition_idx" ON "site_settings" USING btree ("featured_gallery_edition_id");
  CREATE INDEX "_site_settings_v_version_version_featured_gallery_editio_idx" ON "_site_settings_v" USING btree ("version_featured_gallery_edition_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "media" DROP CONSTRAINT "media_gallery_edition_id_event_editions_id_fk";
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_event_editions_fk";
  ALTER TABLE "site_settings" DROP CONSTRAINT "site_settings_featured_gallery_edition_id_event_editions_id_fk";
  ALTER TABLE "_site_settings_v" DROP CONSTRAINT "_site_settings_v_version_featured_gallery_edition_id_event_editions_id_fk";
  DROP INDEX "media_asset_type_idx";
  DROP INDEX "media_gallery_edition_idx";
  DROP INDEX "media_show_in_gallery_idx";
  DROP INDEX "payload_locked_documents_rels_event_editions_id_idx";
  DROP INDEX "site_settings_featured_gallery_edition_idx";
  DROP INDEX "_site_settings_v_version_version_featured_gallery_editio_idx";
  ALTER TABLE "media" DROP COLUMN "asset_type";
  ALTER TABLE "media" DROP COLUMN "gallery_edition_id";
  ALTER TABLE "media" DROP COLUMN "show_in_gallery";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "event_editions_id";
  ALTER TABLE "site_settings" DROP COLUMN "featured_gallery_edition_id";
  ALTER TABLE "_site_settings_v" DROP COLUMN "version_featured_gallery_edition_id";
  ALTER TABLE "event_editions" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "event_editions";
  DROP TYPE "public"."enum_media_asset_type";`)
}
