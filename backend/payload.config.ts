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
import { getPostgresPoolConfig } from "@/lib/postgres-pool";
import { payloadCorsOrigins } from "@/lib/cors";
import { getUploadTempDir } from "@/lib/storage";
import { mkdir } from "node:fs/promises";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const env = getServerEnv();
const uploadTempDir = getUploadTempDir(env.STORAGE_ROOT);

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
  cors: payloadCorsOrigins(
    env.NEXT_PUBLIC_SITE_URL,
    env.NEXT_PUBLIC_API_URL,
    ...env.FRONTEND_ALLOWED_ORIGINS,
    process.env.RENDER_EXTERNAL_URL,
    process.env.RENDER_EXTERNAL_HOSTNAME ? `https://${process.env.RENDER_EXTERNAL_HOSTNAME}` : undefined,
  ),
  csrf: payloadCorsOrigins(
    env.NEXT_PUBLIC_SITE_URL,
    env.NEXT_PUBLIC_API_URL,
    ...env.FRONTEND_ALLOWED_ORIGINS,
    process.env.RENDER_EXTERNAL_URL,
    process.env.RENDER_EXTERNAL_HOSTNAME ? `https://${process.env.RENDER_EXTERNAL_HOSTNAME}` : undefined,
  ),
  db: postgresAdapter({
    pool: getPostgresPoolConfig(env.DATABASE_URL),
    migrationDir: path.resolve(dirname, "migrations"),
    idType: "uuid",
  }),
  sharp,
  upload: {
    abortOnLimit: true,
    createParentPath: true,
    limits: { fileSize: env.UPLOAD_MAX_BYTES, files: 20 },
    preserveExtension: true,
    responseOnLimit: "Image exceeds the configured upload limit.",
    safeFileNames: true,
    tempFileDir: uploadTempDir,
    uploadTimeout: 120_000,
    useTempFiles: process.platform !== "win32" && !process.env.RENDER,
  },
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
  telemetry: false,
  onInit: async (payload) => {
    await mkdir(uploadTempDir, { recursive: true });
    await initializeDefaultContent(payload);
  },
});
