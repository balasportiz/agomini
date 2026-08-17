import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_event_logistics_type" AS ENUM('race-day', 'bib-expo');
  CREATE TABLE "event_logistics" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"_order" varchar,
  	"title" varchar NOT NULL,
  	"type" "enum_event_logistics_type" NOT NULL,
  	"venue" varchar NOT NULL,
  	"address" varchar NOT NULL,
  	"date_time" timestamp(3) with time zone NOT NULL,
  	"directions" varchar NOT NULL,
  	"map_url" varchar,
  	"active" boolean DEFAULT true NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "event_logistics_id" uuid;
  CREATE INDEX "event_logistics__order_idx" ON "event_logistics" USING btree ("_order");
  CREATE INDEX "event_logistics_active_idx" ON "event_logistics" USING btree ("active");
  CREATE INDEX "event_logistics_updated_at_idx" ON "event_logistics" USING btree ("updated_at");
  CREATE INDEX "event_logistics_created_at_idx" ON "event_logistics" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_event_logistics_fk" FOREIGN KEY ("event_logistics_id") REFERENCES "public"."event_logistics"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_event_logistics_id_idx" ON "payload_locked_documents_rels" USING btree ("event_logistics_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_event_logistics_fk";
  DROP INDEX "payload_locked_documents_rels_event_logistics_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "event_logistics_id";
  ALTER TABLE "event_logistics" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "event_logistics";
  DROP TYPE "public"."enum_event_logistics_type";`)
}
