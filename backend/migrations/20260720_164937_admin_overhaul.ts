import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "navigation_header_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"href" varchar NOT NULL
  );
  
  CREATE TABLE "navigation_footer_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"href" varchar NOT NULL
  );
  
  CREATE TABLE "navigation" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "_navigation_v_version_header_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"label" varchar NOT NULL,
  	"href" varchar NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_navigation_v_version_footer_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"label" varchar NOT NULL,
  	"href" varchar NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_navigation_v" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'editor';
  ALTER TABLE "site_settings" ADD COLUMN "hero_manifesto_bengali_word" varchar DEFAULT 'একসাথে';
  ALTER TABLE "site_settings" ADD COLUMN "hero_manifesto_line1" varchar DEFAULT 'Run with strength.';
  ALTER TABLE "site_settings" ADD COLUMN "hero_manifesto_line2" varchar DEFAULT 'Run for safety.';
  ALTER TABLE "site_settings" ADD COLUMN "hero_manifesto_wordmark_top" varchar DEFAULT 'AGOMONI';
  ALTER TABLE "site_settings" ADD COLUMN "hero_manifesto_wordmark_bottom" varchar DEFAULT 'RUN';
  ALTER TABLE "site_settings" ADD COLUMN "hero_manifesto_wordmark_year" varchar DEFAULT '2.0';
  ALTER TABLE "site_settings" ADD COLUMN "hero_manifesto_route_line_start" varchar DEFAULT 'BARASAT';
  ALTER TABLE "site_settings" ADD COLUMN "hero_manifesto_route_line_end" varchar DEFAULT '04 · 10 · 26';
  ALTER TABLE "site_settings" ADD COLUMN "about_bengali_word" varchar DEFAULT 'আগমনী';
  ALTER TABLE "site_settings" ADD COLUMN "about_heading" varchar DEFAULT 'More than a finish line.';
  ALTER TABLE "site_settings" ADD COLUMN "story_chapter_image_id" uuid;
  ALTER TABLE "site_settings" ADD COLUMN "story_chapter_image_alt" varchar DEFAULT 'Runners moving together on an open road';
  ALTER TABLE "site_settings" ADD COLUMN "story_chapter_word" varchar DEFAULT 'TOGETHER';
  ALTER TABLE "site_settings" ADD COLUMN "story_chapter_lead" varchar DEFAULT 'Every stride carries a message.';
  ALTER TABLE "site_settings" ADD COLUMN "story_chapter_heading" varchar DEFAULT 'Safety is not a finish line. It is a responsibility we share.';
  ALTER TABLE "site_settings" ADD COLUMN "community_chapter_image_id" uuid;
  ALTER TABLE "site_settings" ADD COLUMN "community_chapter_image_alt" varchar DEFAULT 'A runner training on a quiet road at dawn';
  ALTER TABLE "site_settings" ADD COLUMN "community_chapter_tag" varchar DEFAULT 'MOVE · WELCOME · PROTECT';
  ALTER TABLE "site_settings" ADD COLUMN "community_chapter_heading" varchar DEFAULT 'Barasat runs together.';
  ALTER TABLE "site_settings" ADD COLUMN "community_chapter_body" varchar DEFAULT 'We welcome Maa Durga through movement, positive social action and the strength of a community choosing to look out for one another.';
  ALTER TABLE "site_settings" ADD COLUMN "community_chapter_cta_label" varchar DEFAULT 'Join the run';
  ALTER TABLE "_site_settings_v" ADD COLUMN "version_hero_manifesto_bengali_word" varchar DEFAULT 'একসাথে';
  ALTER TABLE "_site_settings_v" ADD COLUMN "version_hero_manifesto_line1" varchar DEFAULT 'Run with strength.';
  ALTER TABLE "_site_settings_v" ADD COLUMN "version_hero_manifesto_line2" varchar DEFAULT 'Run for safety.';
  ALTER TABLE "_site_settings_v" ADD COLUMN "version_hero_manifesto_wordmark_top" varchar DEFAULT 'AGOMONI';
  ALTER TABLE "_site_settings_v" ADD COLUMN "version_hero_manifesto_wordmark_bottom" varchar DEFAULT 'RUN';
  ALTER TABLE "_site_settings_v" ADD COLUMN "version_hero_manifesto_wordmark_year" varchar DEFAULT '2.0';
  ALTER TABLE "_site_settings_v" ADD COLUMN "version_hero_manifesto_route_line_start" varchar DEFAULT 'BARASAT';
  ALTER TABLE "_site_settings_v" ADD COLUMN "version_hero_manifesto_route_line_end" varchar DEFAULT '04 · 10 · 26';
  ALTER TABLE "_site_settings_v" ADD COLUMN "version_about_bengali_word" varchar DEFAULT 'আগমনী';
  ALTER TABLE "_site_settings_v" ADD COLUMN "version_about_heading" varchar DEFAULT 'More than a finish line.';
  ALTER TABLE "_site_settings_v" ADD COLUMN "version_story_chapter_image_id" uuid;
  ALTER TABLE "_site_settings_v" ADD COLUMN "version_story_chapter_image_alt" varchar DEFAULT 'Runners moving together on an open road';
  ALTER TABLE "_site_settings_v" ADD COLUMN "version_story_chapter_word" varchar DEFAULT 'TOGETHER';
  ALTER TABLE "_site_settings_v" ADD COLUMN "version_story_chapter_lead" varchar DEFAULT 'Every stride carries a message.';
  ALTER TABLE "_site_settings_v" ADD COLUMN "version_story_chapter_heading" varchar DEFAULT 'Safety is not a finish line. It is a responsibility we share.';
  ALTER TABLE "_site_settings_v" ADD COLUMN "version_community_chapter_image_id" uuid;
  ALTER TABLE "_site_settings_v" ADD COLUMN "version_community_chapter_image_alt" varchar DEFAULT 'A runner training on a quiet road at dawn';
  ALTER TABLE "_site_settings_v" ADD COLUMN "version_community_chapter_tag" varchar DEFAULT 'MOVE · WELCOME · PROTECT';
  ALTER TABLE "_site_settings_v" ADD COLUMN "version_community_chapter_heading" varchar DEFAULT 'Barasat runs together.';
  ALTER TABLE "_site_settings_v" ADD COLUMN "version_community_chapter_body" varchar DEFAULT 'We welcome Maa Durga through movement, positive social action and the strength of a community choosing to look out for one another.';
  ALTER TABLE "_site_settings_v" ADD COLUMN "version_community_chapter_cta_label" varchar DEFAULT 'Join the run';
  ALTER TABLE "navigation_header_links" ADD CONSTRAINT "navigation_header_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_footer_links" ADD CONSTRAINT "navigation_footer_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_navigation_v_version_header_links" ADD CONSTRAINT "_navigation_v_version_header_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_navigation_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_navigation_v_version_footer_links" ADD CONSTRAINT "_navigation_v_version_footer_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_navigation_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "navigation_header_links_order_idx" ON "navigation_header_links" USING btree ("_order");
  CREATE INDEX "navigation_header_links_parent_id_idx" ON "navigation_header_links" USING btree ("_parent_id");
  CREATE INDEX "navigation_footer_links_order_idx" ON "navigation_footer_links" USING btree ("_order");
  CREATE INDEX "navigation_footer_links_parent_id_idx" ON "navigation_footer_links" USING btree ("_parent_id");
  CREATE INDEX "_navigation_v_version_header_links_order_idx" ON "_navigation_v_version_header_links" USING btree ("_order");
  CREATE INDEX "_navigation_v_version_header_links_parent_id_idx" ON "_navigation_v_version_header_links" USING btree ("_parent_id");
  CREATE INDEX "_navigation_v_version_footer_links_order_idx" ON "_navigation_v_version_footer_links" USING btree ("_order");
  CREATE INDEX "_navigation_v_version_footer_links_parent_id_idx" ON "_navigation_v_version_footer_links" USING btree ("_parent_id");
  CREATE INDEX "_navigation_v_created_at_idx" ON "_navigation_v" USING btree ("created_at");
  CREATE INDEX "_navigation_v_updated_at_idx" ON "_navigation_v" USING btree ("updated_at");
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_story_chapter_image_id_media_id_fk" FOREIGN KEY ("story_chapter_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_community_chapter_image_id_media_id_fk" FOREIGN KEY ("community_chapter_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_site_settings_v" ADD CONSTRAINT "_site_settings_v_version_story_chapter_image_id_media_id_fk" FOREIGN KEY ("version_story_chapter_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_site_settings_v" ADD CONSTRAINT "_site_settings_v_version_community_chapter_image_id_media_id_fk" FOREIGN KEY ("version_community_chapter_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "site_settings_story_chapter_story_chapter_image_idx" ON "site_settings" USING btree ("story_chapter_image_id");
  CREATE INDEX "site_settings_community_chapter_community_chapter_image_idx" ON "site_settings" USING btree ("community_chapter_image_id");
  CREATE INDEX "_site_settings_v_version_story_chapter_version_story_cha_idx" ON "_site_settings_v" USING btree ("version_story_chapter_image_id");
  CREATE INDEX "_site_settings_v_version_community_chapter_version_commu_idx" ON "_site_settings_v" USING btree ("version_community_chapter_image_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "navigation_header_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "navigation_footer_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "navigation" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_navigation_v_version_header_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_navigation_v_version_footer_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_navigation_v" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "navigation_header_links" CASCADE;
  DROP TABLE "navigation_footer_links" CASCADE;
  DROP TABLE "navigation" CASCADE;
  DROP TABLE "_navigation_v_version_header_links" CASCADE;
  DROP TABLE "_navigation_v_version_footer_links" CASCADE;
  DROP TABLE "_navigation_v" CASCADE;
  ALTER TABLE "site_settings" DROP CONSTRAINT "site_settings_story_chapter_image_id_media_id_fk";
  
  ALTER TABLE "site_settings" DROP CONSTRAINT "site_settings_community_chapter_image_id_media_id_fk";
  
  ALTER TABLE "_site_settings_v" DROP CONSTRAINT "_site_settings_v_version_story_chapter_image_id_media_id_fk";
  
  ALTER TABLE "_site_settings_v" DROP CONSTRAINT "_site_settings_v_version_community_chapter_image_id_media_id_fk";
  
  ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'admin';
  DROP INDEX "site_settings_story_chapter_story_chapter_image_idx";
  DROP INDEX "site_settings_community_chapter_community_chapter_image_idx";
  DROP INDEX "_site_settings_v_version_story_chapter_version_story_cha_idx";
  DROP INDEX "_site_settings_v_version_community_chapter_version_commu_idx";
  ALTER TABLE "site_settings" DROP COLUMN "hero_manifesto_bengali_word";
  ALTER TABLE "site_settings" DROP COLUMN "hero_manifesto_line1";
  ALTER TABLE "site_settings" DROP COLUMN "hero_manifesto_line2";
  ALTER TABLE "site_settings" DROP COLUMN "hero_manifesto_wordmark_top";
  ALTER TABLE "site_settings" DROP COLUMN "hero_manifesto_wordmark_bottom";
  ALTER TABLE "site_settings" DROP COLUMN "hero_manifesto_wordmark_year";
  ALTER TABLE "site_settings" DROP COLUMN "hero_manifesto_route_line_start";
  ALTER TABLE "site_settings" DROP COLUMN "hero_manifesto_route_line_end";
  ALTER TABLE "site_settings" DROP COLUMN "about_bengali_word";
  ALTER TABLE "site_settings" DROP COLUMN "about_heading";
  ALTER TABLE "site_settings" DROP COLUMN "story_chapter_image_id";
  ALTER TABLE "site_settings" DROP COLUMN "story_chapter_image_alt";
  ALTER TABLE "site_settings" DROP COLUMN "story_chapter_word";
  ALTER TABLE "site_settings" DROP COLUMN "story_chapter_lead";
  ALTER TABLE "site_settings" DROP COLUMN "story_chapter_heading";
  ALTER TABLE "site_settings" DROP COLUMN "community_chapter_image_id";
  ALTER TABLE "site_settings" DROP COLUMN "community_chapter_image_alt";
  ALTER TABLE "site_settings" DROP COLUMN "community_chapter_tag";
  ALTER TABLE "site_settings" DROP COLUMN "community_chapter_heading";
  ALTER TABLE "site_settings" DROP COLUMN "community_chapter_body";
  ALTER TABLE "site_settings" DROP COLUMN "community_chapter_cta_label";
  ALTER TABLE "_site_settings_v" DROP COLUMN "version_hero_manifesto_bengali_word";
  ALTER TABLE "_site_settings_v" DROP COLUMN "version_hero_manifesto_line1";
  ALTER TABLE "_site_settings_v" DROP COLUMN "version_hero_manifesto_line2";
  ALTER TABLE "_site_settings_v" DROP COLUMN "version_hero_manifesto_wordmark_top";
  ALTER TABLE "_site_settings_v" DROP COLUMN "version_hero_manifesto_wordmark_bottom";
  ALTER TABLE "_site_settings_v" DROP COLUMN "version_hero_manifesto_wordmark_year";
  ALTER TABLE "_site_settings_v" DROP COLUMN "version_hero_manifesto_route_line_start";
  ALTER TABLE "_site_settings_v" DROP COLUMN "version_hero_manifesto_route_line_end";
  ALTER TABLE "_site_settings_v" DROP COLUMN "version_about_bengali_word";
  ALTER TABLE "_site_settings_v" DROP COLUMN "version_about_heading";
  ALTER TABLE "_site_settings_v" DROP COLUMN "version_story_chapter_image_id";
  ALTER TABLE "_site_settings_v" DROP COLUMN "version_story_chapter_image_alt";
  ALTER TABLE "_site_settings_v" DROP COLUMN "version_story_chapter_word";
  ALTER TABLE "_site_settings_v" DROP COLUMN "version_story_chapter_lead";
  ALTER TABLE "_site_settings_v" DROP COLUMN "version_story_chapter_heading";
  ALTER TABLE "_site_settings_v" DROP COLUMN "version_community_chapter_image_id";
  ALTER TABLE "_site_settings_v" DROP COLUMN "version_community_chapter_image_alt";
  ALTER TABLE "_site_settings_v" DROP COLUMN "version_community_chapter_tag";
  ALTER TABLE "_site_settings_v" DROP COLUMN "version_community_chapter_heading";
  ALTER TABLE "_site_settings_v" DROP COLUMN "version_community_chapter_body";
  ALTER TABLE "_site_settings_v" DROP COLUMN "version_community_chapter_cta_label";`)
}
