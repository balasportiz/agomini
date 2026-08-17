import path from "node:path";
import { fileURLToPath } from "node:url";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { buildConfig } from "payload";
import sharp from "sharp";
import { FAQs } from "@/collections/FAQs";
import { EventEditions } from "@/collections/EventEditions";
import { EventLogistics } from "@/collections/EventLogistics";
import { Highlights } from "@/collections/Highlights";
import { Media } from "@/collections/Media";
import { RaceCategories } from "@/collections/RaceCategories";
import { Sponsors } from "@/collections/Sponsors";
import { Users } from "@/collections/Users";
import { Navigation } from "@/globals/Navigation";
import { SiteSettings } from "@/globals/SiteSettings";
import { getServerEnv } from "@/lib/env";
import { initializeDefaultContent } from "@/lib/initialize-content";
import { getStorageLayout } from "@/lib/storage";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const env = getServerEnv();
const storage = getStorageLayout(env.STORAGE_ROOT);

export default buildConfig({
  // The default Payload admin UI has been removed in favour of the custom
  // Studio at /studio. Payload still needs an `admin.user` collection for auth
  // and an `importMap` for its REST/server internals, but no admin components,
  // dashboards or meta are registered any more.
  admin: {
    user: Users.slug,
    importMap: { baseDir: dirname },
  },
  collections: [Users, RaceCategories, EventLogistics, EventEditions, Media, Highlights, FAQs, Sponsors],
  globals: [SiteSettings, Navigation],
  editor: lexicalEditor(),
  secret: env.PAYLOAD_SECRET,
  serverURL: env.NEXT_PUBLIC_SITE_URL,
  cors: [env.NEXT_PUBLIC_SITE_URL],
  csrf: [env.NEXT_PUBLIC_SITE_URL],
  db: postgresAdapter({
    pool: { connectionString: env.DATABASE_URL },
    migrationDir: path.resolve(dirname, "migrations"),
    idType: "uuid",
  }),
  sharp,
  upload: {
    abortOnLimit: true,
    createParentPath: true,
    limits: { fileSize: env.UPLOAD_MAX_BYTES, files: 20 },
    preserveExtension: 8,
    responseOnLimit: "Image exceeds the configured upload limit.",
    safeFileNames: true,
    tempFileDir: storage.temp,
    uploadTimeout: 120_000,
    useTempFiles: process.platform !== "win32",
  },
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
  telemetry: false,
  onInit: initializeDefaultContent,
});