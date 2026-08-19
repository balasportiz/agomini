import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "event_editions"
      ADD COLUMN IF NOT EXISTS "show_in_results" boolean DEFAULT false NOT NULL;
    UPDATE "event_editions" SET "show_in_results" = "active";
    CREATE INDEX IF NOT EXISTS "event_editions_show_in_results_idx" ON "event_editions" USING btree ("show_in_results");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "event_editions_show_in_results_idx";
    ALTER TABLE "event_editions" DROP COLUMN IF EXISTS "show_in_results";
  `)
}
