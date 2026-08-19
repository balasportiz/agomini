import { readFileSync, readdirSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import type { CollectionConfig, Field, GlobalConfig } from "payload"
import { describe, expect, it, vi } from "vitest"

// Collection modules read the server env at import time.
vi.hoisted(() => {
  process.env.DATABASE_URL ??= "postgresql://user:pass@localhost:5432/agomoni"
  process.env.PAYLOAD_SECRET ??= "a-secure-secret-that-is-at-least-32-chars"
  process.env.NEXT_PUBLIC_SITE_URL ??= "http://localhost:3000"
})

import { FAQs } from "@/collections/FAQs"
import { EventEditions } from "@/collections/EventEditions"
import { EventLogistics } from "@/collections/EventLogistics"
import { Highlights } from "@/collections/Highlights"
import { Media } from "@/collections/Media"
import { RaceCategories } from "@/collections/RaceCategories"
import { Sponsors } from "@/collections/Sponsors"
import { Users } from "@/collections/Users"
import { Navigation } from "@/globals/Navigation"
import { SiteSettings } from "@/globals/SiteSettings"

/**
 * Production runs `payload migrate`, never schema push, so a field added to a
 * collection or global without a matching migration makes every read of that
 * table fail with a 500 the moment it deploys. This guard catches that in CI
 * instead of in production.
 */

const migrationsDir = path.resolve(fileURLToPath(new URL("../../migrations", import.meta.url)))

// Only the .ts files hold executable SQL; the .json snapshots beside them
// describe intent and would mask a migration that was never written.
const migrationSql = readdirSync(migrationsDir)
  .filter((file) => file.endsWith(".ts") && file !== "index.ts")
  .map((file) => readFileSync(path.join(migrationsDir, file), "utf8"))
  .join("\n")
  .toLowerCase()

/** Payload stores scalar fields as snake_case columns; nested groups are prefixed. */
const toColumn = (name: string) => name.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase()

/** Field types that become their own column on the parent table. */
const SCALAR_TYPES = new Set(["text", "textarea", "number", "checkbox", "date", "email", "select", "radio", "code", "json", "point"])

/** Types that live in separate tables (arrays, blocks, relationships) or hold no data. */
const CONTAINER_TYPES = new Set(["row", "collapsible", "tabs", "group"])

function collectColumns(fields: Field[], prefix = ""): string[] {
  const columns: string[] = []
  for (const field of fields) {
    if (field.type === "tabs") {
      for (const tab of field.tabs) {
        const tabPrefix = "name" in tab && tab.name ? `${prefix}${toColumn(tab.name)}_` : prefix
        columns.push(...collectColumns(tab.fields, tabPrefix))
      }
      continue
    }
    if (CONTAINER_TYPES.has(field.type)) {
      const nextPrefix = "name" in field && field.name ? `${prefix}${toColumn(field.name)}_` : prefix
      columns.push(...collectColumns((field as { fields: Field[] }).fields, nextPrefix))
      continue
    }
    if (!("name" in field) || !field.name) continue
    if (!SCALAR_TYPES.has(field.type)) continue
    columns.push(`${prefix}${toColumn(field.name)}`)
  }
  return columns
}

const globals: GlobalConfig[] = [SiteSettings, Navigation]
const collections: CollectionConfig[] = [
  EventEditions,
  EventLogistics,
  FAQs,
  Highlights,
  Media,
  RaceCategories,
  Sponsors,
  Users,
]

describe("migrations cover every schema field", () => {
  it.each(globals.map((global) => [global.slug, global] as const))(
    "global %s has a migration column for each field",
    (_slug, global) => {
      const missing = collectColumns(global.fields).filter((column) => !migrationSql.includes(`"${column}"`))
      expect(missing, `add a migration for: ${missing.join(", ")}`).toEqual([])
    },
  )

  it.each(collections.map((collection) => [collection.slug, collection] as const))(
    "collection %s has a migration column for each field",
    (_slug, collection) => {
      const missing = collectColumns(collection.fields).filter((column) => !migrationSql.includes(`"${column}"`))
      expect(missing, `add a migration for: ${missing.join(", ")}`).toEqual([])
    },
  )

  it("registers every migration file in the index", () => {
    const index = readFileSync(path.join(migrationsDir, "index.ts"), "utf8")
    const files = readdirSync(migrationsDir).filter((file) => file.endsWith(".ts") && file !== "index.ts")
    const unregistered = files.filter((file) => !index.includes(file.replace(/\.ts$/, "")))
    expect(unregistered, `register these in migrations/index.ts: ${unregistered.join(", ")}`).toEqual([])
  })
})
