import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_users_role" AS ENUM('admin');
  CREATE TYPE "public"."enum_site_settings_registration_status" AS ENUM('soon', 'open', 'closed', 'completed');
  CREATE TYPE "public"."enum__site_settings_v_version_registration_status" AS ENUM('soon', 'open', 'closed', 'completed');
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"name" varchar NOT NULL,
  	"role" "enum_users_role" DEFAULT 'admin' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "race_categories_inclusions" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"item" varchar NOT NULL
  );
  
  CREATE TABLE "race_categories" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"_order" varchar,
  	"name" varchar NOT NULL,
  	"distance" varchar NOT NULL,
  	"fee" varchar DEFAULT 'To be announced' NOT NULL,
  	"reporting_time" varchar DEFAULT 'To be announced' NOT NULL,
  	"start_time" varchar DEFAULT 'To be announced' NOT NULL,
  	"description" varchar NOT NULL,
  	"age_eligibility" varchar,
  	"active" boolean DEFAULT true NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "media_tags" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"tag" varchar NOT NULL
  );
  
  CREATE TABLE "media" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"_order" varchar,
  	"alt_text" varchar NOT NULL,
  	"caption" varchar,
  	"active" boolean DEFAULT true NOT NULL,
  	"featured" boolean DEFAULT false NOT NULL,
  	"uploaded_by_id" uuid,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "highlights" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"_order" varchar,
  	"title" varchar NOT NULL,
  	"description" varchar NOT NULL,
  	"photo_id" uuid,
  	"active" boolean DEFAULT true NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "faqs" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"_order" varchar,
  	"question" varchar NOT NULL,
  	"answer" varchar NOT NULL,
  	"active" boolean DEFAULT true NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "sponsors" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"_order" varchar,
  	"name" varchar NOT NULL,
  	"logo_id" uuid NOT NULL,
  	"website_url" varchar,
  	"description" varchar,
  	"active" boolean DEFAULT true NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_kv" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" uuid,
  	"race_categories_id" uuid,
  	"media_id" uuid,
  	"highlights_id" uuid,
  	"faqs_id" uuid,
  	"sponsors_id" uuid
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" uuid
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "site_settings" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"event_name" varchar DEFAULT 'Agomoni Run 2.0' NOT NULL,
  	"tagline" varchar DEFAULT 'Run with strength. Run for safety.' NOT NULL,
  	"event_date_time" timestamp(3) with time zone DEFAULT '2026-10-04T00:30:00.000Z' NOT NULL,
  	"timing_confirmed" boolean DEFAULT false,
  	"timezone" varchar DEFAULT 'Asia/Kolkata' NOT NULL,
  	"venue" varchar DEFAULT 'Barasat, Subhash Maidan, West Bengal' NOT NULL,
  	"organiser_name" varchar DEFAULT 'Barasat Runners' NOT NULL,
  	"organiser_description" varchar DEFAULT 'A community of runners bringing Barasat together through movement, respect and collective responsibility.' NOT NULL,
  	"hero_heading" varchar DEFAULT 'Run with strength. Run for safety.' NOT NULL,
  	"hero_subheading" varchar DEFAULT 'As Bengal prepares to welcome Maa Durga, Barasat comes together for a celebration of courage, community and movement.' NOT NULL,
  	"hero_photo_id" uuid,
  	"registration_url" varchar,
  	"results_url" varchar,
  	"registration_status" "enum_site_settings_registration_status" DEFAULT 'soon' NOT NULL,
  	"about" varchar DEFAULT 'Agomoni Run brings runners and the local community together in Barasat, combining the energy of road running with Bengal’s Agomoni spirit. Running together represents courage, respect, unity and our shared responsibility to make public spaces safer for women.' NOT NULL,
  	"announcement_enabled" boolean DEFAULT false,
  	"announcement_text" varchar,
  	"announcement_link_label" varchar,
  	"announcement_link_url" varchar,
  	"contact_email" varchar,
  	"primary_phone" varchar,
  	"secondary_phone" varchar,
  	"instagram_url" varchar,
  	"facebook_url" varchar,
  	"youtube_url" varchar,
  	"gallery_title" varchar DEFAULT 'Agomoni Run 1.0' NOT NULL,
  	"gallery_description" varchar DEFAULT 'Moments of movement, solidarity and celebration from the previous edition.' NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "_site_settings_v" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"version_event_name" varchar DEFAULT 'Agomoni Run 2.0' NOT NULL,
  	"version_tagline" varchar DEFAULT 'Run with strength. Run for safety.' NOT NULL,
  	"version_event_date_time" timestamp(3) with time zone DEFAULT '2026-10-04T00:30:00.000Z' NOT NULL,
  	"version_timing_confirmed" boolean DEFAULT false,
  	"version_timezone" varchar DEFAULT 'Asia/Kolkata' NOT NULL,
  	"version_venue" varchar DEFAULT 'Barasat, Subhash Maidan, West Bengal' NOT NULL,
  	"version_organiser_name" varchar DEFAULT 'Barasat Runners' NOT NULL,
  	"version_organiser_description" varchar DEFAULT 'A community of runners bringing Barasat together through movement, respect and collective responsibility.' NOT NULL,
  	"version_hero_heading" varchar DEFAULT 'Run with strength. Run for safety.' NOT NULL,
  	"version_hero_subheading" varchar DEFAULT 'As Bengal prepares to welcome Maa Durga, Barasat comes together for a celebration of courage, community and movement.' NOT NULL,
  	"version_hero_photo_id" uuid,
  	"version_registration_url" varchar,
  	"version_results_url" varchar,
  	"version_registration_status" "enum__site_settings_v_version_registration_status" DEFAULT 'soon' NOT NULL,
  	"version_about" varchar DEFAULT 'Agomoni Run brings runners and the local community together in Barasat, combining the energy of road running with Bengal’s Agomoni spirit. Running together represents courage, respect, unity and our shared responsibility to make public spaces safer for women.' NOT NULL,
  	"version_announcement_enabled" boolean DEFAULT false,
  	"version_announcement_text" varchar,
  	"version_announcement_link_label" varchar,
  	"version_announcement_link_url" varchar,
  	"version_contact_email" varchar,
  	"version_primary_phone" varchar,
  	"version_secondary_phone" varchar,
  	"version_instagram_url" varchar,
  	"version_facebook_url" varchar,
  	"version_youtube_url" varchar,
  	"version_gallery_title" varchar DEFAULT 'Agomoni Run 1.0' NOT NULL,
  	"version_gallery_description" varchar DEFAULT 'Moments of movement, solidarity and celebration from the previous edition.' NOT NULL,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "race_categories_inclusions" ADD CONSTRAINT "race_categories_inclusions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."race_categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "media_tags" ADD CONSTRAINT "media_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "media" ADD CONSTRAINT "media_uploaded_by_id_users_id_fk" FOREIGN KEY ("uploaded_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "highlights" ADD CONSTRAINT "highlights_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "sponsors" ADD CONSTRAINT "sponsors_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_race_categories_fk" FOREIGN KEY ("race_categories_id") REFERENCES "public"."race_categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_highlights_fk" FOREIGN KEY ("highlights_id") REFERENCES "public"."highlights"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_faqs_fk" FOREIGN KEY ("faqs_id") REFERENCES "public"."faqs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_sponsors_fk" FOREIGN KEY ("sponsors_id") REFERENCES "public"."sponsors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_hero_photo_id_media_id_fk" FOREIGN KEY ("hero_photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_site_settings_v" ADD CONSTRAINT "_site_settings_v_version_hero_photo_id_media_id_fk" FOREIGN KEY ("version_hero_photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX "race_categories_inclusions_order_idx" ON "race_categories_inclusions" USING btree ("_order");
  CREATE INDEX "race_categories_inclusions_parent_id_idx" ON "race_categories_inclusions" USING btree ("_parent_id");
  CREATE INDEX "race_categories__order_idx" ON "race_categories" USING btree ("_order");
  CREATE INDEX "race_categories_active_idx" ON "race_categories" USING btree ("active");
  CREATE INDEX "race_categories_updated_at_idx" ON "race_categories" USING btree ("updated_at");
  CREATE INDEX "race_categories_created_at_idx" ON "race_categories" USING btree ("created_at");
  CREATE INDEX "media_tags_order_idx" ON "media_tags" USING btree ("_order");
  CREATE INDEX "media_tags_parent_id_idx" ON "media_tags" USING btree ("_parent_id");
  CREATE INDEX "media__order_idx" ON "media" USING btree ("_order");
  CREATE INDEX "media_active_idx" ON "media" USING btree ("active");
  CREATE INDEX "media_featured_idx" ON "media" USING btree ("featured");
  CREATE INDEX "media_uploaded_by_idx" ON "media" USING btree ("uploaded_by_id");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "highlights__order_idx" ON "highlights" USING btree ("_order");
  CREATE INDEX "highlights_photo_idx" ON "highlights" USING btree ("photo_id");
  CREATE INDEX "highlights_active_idx" ON "highlights" USING btree ("active");
  CREATE INDEX "highlights_updated_at_idx" ON "highlights" USING btree ("updated_at");
  CREATE INDEX "highlights_created_at_idx" ON "highlights" USING btree ("created_at");
  CREATE INDEX "faqs__order_idx" ON "faqs" USING btree ("_order");
  CREATE INDEX "faqs_active_idx" ON "faqs" USING btree ("active");
  CREATE INDEX "faqs_updated_at_idx" ON "faqs" USING btree ("updated_at");
  CREATE INDEX "faqs_created_at_idx" ON "faqs" USING btree ("created_at");
  CREATE INDEX "sponsors__order_idx" ON "sponsors" USING btree ("_order");
  CREATE INDEX "sponsors_logo_idx" ON "sponsors" USING btree ("logo_id");
  CREATE INDEX "sponsors_active_idx" ON "sponsors" USING btree ("active");
  CREATE INDEX "sponsors_updated_at_idx" ON "sponsors" USING btree ("updated_at");
  CREATE INDEX "sponsors_created_at_idx" ON "sponsors" USING btree ("created_at");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_race_categories_id_idx" ON "payload_locked_documents_rels" USING btree ("race_categories_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_highlights_id_idx" ON "payload_locked_documents_rels" USING btree ("highlights_id");
  CREATE INDEX "payload_locked_documents_rels_faqs_id_idx" ON "payload_locked_documents_rels" USING btree ("faqs_id");
  CREATE INDEX "payload_locked_documents_rels_sponsors_id_idx" ON "payload_locked_documents_rels" USING btree ("sponsors_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");
  CREATE INDEX "site_settings_hero_photo_idx" ON "site_settings" USING btree ("hero_photo_id");
  CREATE INDEX "_site_settings_v_version_version_hero_photo_idx" ON "_site_settings_v" USING btree ("version_hero_photo_id");
  CREATE INDEX "_site_settings_v_created_at_idx" ON "_site_settings_v" USING btree ("created_at");
  CREATE INDEX "_site_settings_v_updated_at_idx" ON "_site_settings_v" USING btree ("updated_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "race_categories_inclusions" CASCADE;
  DROP TABLE "race_categories" CASCADE;
  DROP TABLE "media_tags" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "highlights" CASCADE;
  DROP TABLE "faqs" CASCADE;
  DROP TABLE "sponsors" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TABLE "site_settings" CASCADE;
  DROP TABLE "_site_settings_v" CASCADE;
  DROP TYPE "public"."enum_users_role";
  DROP TYPE "public"."enum_site_settings_registration_status";
  DROP TYPE "public"."enum__site_settings_v_version_registration_status";`)
}
