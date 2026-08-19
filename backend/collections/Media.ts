import type { CollectionConfig } from "payload";
import { headersWithCors } from "payload";
import { mediaManagerOrAbove, publicReadActive } from "@/lib/access";
import { adminPreview } from "@/lib/admin-preview";
import { getServerEnv } from "@/lib/env";
import { isMediaManagerOrAbove } from "@/lib/roles";
import { notifyContentChanged } from "@/lib/realtime";
import {
  downloadDriveFile,
  getAvailableDriveImportModes,
  listDriveImportCandidates,
  type DriveImportMode,
} from "@/lib/google-drive";
import {
  assertStorageCapacity,
  createStoredFilename,
  deleteFile,
  ensureStorageLayout,
  getStorageLayout,
  getR2ConfigError,
  isR2Active,
  r2PutObject,
  readUploadBuffer,
  validateUploadCandidate,
  type UploadCandidate,
} from "@/lib/storage";

const env = getServerEnv();
const storage = getStorageLayout(env.STORAGE_ROOT);

type DriveImportRequestBody = {
  link?: string;
  mode?: DriveImportMode;
  editionId?: string;
};

type DriveImportResult = {
  name: string;
  status: "imported" | "failed";
  error?: string;
};

type DriveImportProgressEvent = {
  type: "progress";
  phase: "downloading" | "processing" | "complete";
  fileName: string;
  currentFile: number;
  totalFiles: number;
  completedFiles: number;
  transferredBytes: number;
  totalBytes: number;
  imported: number;
  failed: number;
};

type DriveImportStreamEvent =
  | DriveImportProgressEvent
  | { type: "complete"; results: DriveImportResult[] }
  | { type: "error"; error: string };

export const Media: CollectionConfig = {
  slug: "media",
  disableBulkEdit: true,
  admin: {
    group: "Gallery",
    useAsTitle: "filename",
    defaultColumns: ["filename", "altText", "active", "featured", "updatedAt"],
    description:
      "Upload photos inactive first, then publish only images approved for the public gallery. Accessibility descriptions and visible captions are optional.",
    ...adminPreview("/gallery"),
  },
  access: {
    create: mediaManagerOrAbove,
    delete: mediaManagerOrAbove,
    read: publicReadActive,
    update: mediaManagerOrAbove,
  },
  orderable: true,
  defaultSort: "_order",
  endpoints: [
    {
      path: "/drive-import-modes",
      method: "get",
      handler: async (req) => {
        if (!isMediaManagerOrAbove(req.user)) {
          return Response.json(
            { error: "Forbidden" },
            { status: 403, headers: headersWithCors({ headers: new Headers(), req }) },
          );
        }
        return Response.json(
          { modes: getAvailableDriveImportModes() },
          { headers: headersWithCors({ headers: new Headers(), req }) },
        );
      },
    },
    {
      path: "/drive-import",
      method: "post",
      handler: async (req) => {
        const corsHeaders = headersWithCors({ headers: new Headers(), req });
        if (!isMediaManagerOrAbove(req.user)) {
          return Response.json({ error: "Forbidden" }, { status: 403, headers: corsHeaders });
        }

        const body = (await req.json?.()) as DriveImportRequestBody | undefined;
        const link = body?.link?.trim();
        const mode = body?.mode;
        const editionId = body?.editionId?.trim();
        if (!link || !editionId || (mode !== "api-key" && mode !== "service-account")) {
          return Response.json(
            { error: "A Drive link, import mode and event edition are required." },
            { status: 400, headers: corsHeaders },
          );
        }
        if (!getAvailableDriveImportModes().includes(mode)) {
          return Response.json(
            { error: `The "${mode}" Drive import method is not configured on this server.` },
            { status: 400, headers: corsHeaders },
          );
        }

        let candidates;
        try {
          candidates = await listDriveImportCandidates(link, mode);
        } catch (error) {
          return Response.json(
            { error: error instanceof Error ? error.message : "Could not read that Google Drive link." },
            { status: 400, headers: corsHeaders },
          );
        }
        if (candidates.length === 0) {
          return Response.json(
            { error: "No JPEG, PNG or WebP images were found at that Drive link." },
            { status: 400, headers: corsHeaders },
          );
        }

        const totalBytes = candidates.reduce((sum, c) => sum + (c.size ?? 0), 0);
        let cancelled = false;

        const stream = new ReadableStream<Uint8Array>({
          start(controller) {
            const encoder = new TextEncoder();
            const emit = (event: DriveImportStreamEvent) => {
              if (cancelled) return;
              try {
                controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
              } catch {
                cancelled = true;
              }
            };

            void (async () => {
              const results: DriveImportResult[] = [];
              let accountedBytes = 0;
              let imported = 0;
              let failed = 0;

              for (const [index, candidate] of candidates.entries()) {
                if (cancelled) break;
                let fileLoaded = 0;
                let lastProgressAt = 0;

                try {
                  const downloaded = await downloadDriveFile(candidate, mode, ({ loaded }) => {
                    fileLoaded = loaded;
                    const now = Date.now();
                    if (
                      loaded < (candidate.size ?? Number.POSITIVE_INFINITY) &&
                      now - lastProgressAt < 150
                    )
                      return;
                    lastProgressAt = now;
                    emit({
                      type: "progress",
                      phase: "downloading",
                      fileName: candidate.name,
                      currentFile: index + 1,
                      totalFiles: candidates.length,
                      completedFiles: index,
                      transferredBytes: accountedBytes + loaded,
                      totalBytes,
                      imported,
                      failed,
                    });
                  });

                  fileLoaded = downloaded.size;
                  emit({
                    type: "progress",
                    phase: "processing",
                    fileName: downloaded.name,
                    currentFile: index + 1,
                    totalFiles: candidates.length,
                    completedFiles: index,
                    transferredBytes: accountedBytes + downloaded.size,
                    totalBytes,
                    imported,
                    failed,
                  });

                  await req.payload.create({
                    collection: "media",
                    req,
                    overrideAccess: false,
                    draft: false,
                    data: {
                      altText: "",
                      active: false,
                      featured: false,
                      assetType: "event-gallery",
                      showInGallery: true,
                      galleryEdition: editionId,
                    },
                    file: {
                      data: downloaded.data,
                      mimetype: downloaded.mimeType,
                      name: downloaded.name,
                      size: downloaded.size,
                    },
                  });
                  imported += 1;
                  results.push({ name: downloaded.name, status: "imported" });
                } catch (error) {
                  failed += 1;
                  results.push({
                    name: candidate.name,
                    status: "failed",
                    error: error instanceof Error ? error.message : "Import failed.",
                  });
                }

                accountedBytes += candidate.size ?? fileLoaded;
                emit({
                  type: "progress",
                  phase: index === candidates.length - 1 ? "complete" : "downloading",
                  fileName: candidate.name,
                  currentFile: index + 1,
                  totalFiles: candidates.length,
                  completedFiles: index + 1,
                  transferredBytes:
                    totalBytes > 0
                      ? Math.min(accountedBytes, totalBytes)
                      : accountedBytes,
                  totalBytes,
                  imported,
                  failed,
                });
              }

              if (!cancelled) {
                emit({ type: "complete", results });
                controller.close();
              }
            })().catch((error) => {
              emit({
                type: "error",
                error: error instanceof Error ? error.message : "Google Drive import failed.",
              });
              if (!cancelled) controller.close();
            });
          },
          cancel() {
            cancelled = true;
          },
        });

        corsHeaders.set("Content-Type", "application/x-ndjson; charset=utf-8");
        corsHeaders.set("Cache-Control", "no-cache, no-transform");
        corsHeaders.set("X-Accel-Buffering", "no");
        return new Response(stream, { headers: corsHeaders });
      },
    },
  ],
  hooks: {
    beforeOperation: [
      async ({ operation, req }) => {
        if ((operation === "create" || operation === "update") && req.file) {
          const r2Problem = getR2ConfigError();
          if (r2Problem) throw new Error(r2Problem);
          if (process.env.RENDER && !isR2Active()) {
            throw new Error("Photo uploads on Render require complete S3_* R2 variables.");
          }
          const file = req.file as unknown as UploadCandidate;

          // Validate mime type and magic bytes regardless of storage backend
          await validateUploadCandidate(file, env.UPLOAD_MAX_BYTES);

          if (isR2Active()) {
            // R2 mode: assign a collision-resistant filename; Payload's
            // staticDir handler is bypassed so we upload manually in
            // afterOperation instead. No disk-capacity check needed.
            req.file.name = createStoredFilename(file.name, undefined, file.mimetype);
          } else {
            // Local disk mode: check capacity and let Payload write the file
            await ensureStorageLayout(storage);
            await assertStorageCapacity(storage.root, file.size, env.STORAGE_RESERVE_BYTES);
            req.file.name = createStoredFilename(file.name, undefined, file.mimetype);
          }
        }
      },
    ],
    beforeChange: [
      async ({ operation, req, data }) => {
        if (isR2Active() && (operation === "create" || operation === "update") && req.file) {
          const file = req.file as unknown as UploadCandidate;
          const filename = file.name;
          const bytes = await readUploadBuffer(file);
          try {
            await r2PutObject(filename, bytes, file.mimetype);
          } catch (error) {
            console.error("[storage] R2 PutObject failed", error);
            throw error;
          }
        }
        return data;
      },
    ],
    afterDelete: [
      async ({ doc }) => {
        notifyContentChanged("media");
        // Clean up the stored file from R2 or local disk
        const filename = (doc as Record<string, unknown>)?.filename;
        if (typeof filename === "string") {
          try {
            await deleteFile(filename, env.STORAGE_ROOT);
          } catch (error) {
            console.error(`[storage] Failed to delete ${filename}:`, error);
          }
        }
      },
    ],
    afterChange: [() => notifyContentChanged("media")],
  },
  upload: {
    disableLocalStorage: isR2Active(),
    // When R2 is active, Payload keeps the file in memory/temp; we push bytes
    // to R2 in afterOperation. staticDir is only the local-disk fallback.
    staticDir: storage.root,
    bulkUpload: true,
    pasteURL: false,
    mimeTypes: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
    ...(isR2Active()
      ? {}
      : {
          resizeOptions: {
            width: 5000,
            height: 5000,
            fit: "inside" as const,
            withoutEnlargement: true,
          },
        }),
  },
  fields: [
    {
      name: "altText",
      label: "Accessibility description (optional)",
      type: "text",
      maxLength: 180,
      admin: {
        description:
          "Used by screen readers and shown if the image cannot load. This text is not displayed as a caption.",
      },
    },
    {
      name: "caption",
      label: "Visible caption (optional)",
      type: "textarea",
      maxLength: 300,
      admin: { description: "Displayed with the photograph in the public gallery." },
    },
    {
      name: "tags",
      type: "array",
      maxRows: 12,
      fields: [{ name: "tag", type: "text", required: true, maxLength: 40 }],
    },
    {
      name: "assetType",
      label: "Asset purpose",
      type: "select",
      required: true,
      defaultValue: "site",
      index: true,
      options: [
        { label: "Event gallery photo", value: "event-gallery" },
        { label: "Website/story image", value: "site" },
        { label: "Partner logo", value: "partner" },
      ],
      admin: {
        description:
          "Keeps logos and website artwork out of the public event gallery.",
      },
    },
    {
      name: "galleryEdition",
      label: "Event edition",
      type: "relationship",
      relationTo: "event-editions",
      index: true,
      admin: {
        condition: (_, siblingData) =>
          siblingData?.assetType === "event-gallery" || siblingData?.showInGallery === true,
        description: "The archive this photograph belongs to.",
      },
    },
    {
      name: "showInGallery",
      label: "Include in event gallery",
      type: "checkbox",
      defaultValue: false,
      required: true,
      index: true,
      admin: {
        description: "Show on this edition's gallery page. The photo also needs to be Live before visitors can see it.",
      },
    },
    {
      name: "active",
      type: "checkbox",
      defaultValue: false,
      required: true,
      index: true,
      admin: { description: "Master switch — when off, the photo is hidden everywhere on the public site." },
    },
    { name: "featured", type: "checkbox", defaultValue: false, required: true, index: true, admin: { description: "Show in the homepage gallery preview. The photo also needs to be Live." } },
    {
      name: "uploadedBy",
      type: "relationship",
      relationTo: "users",
      admin: { readOnly: true },
      hooks: {
        beforeChange: [({ req, value }) => value || req.user?.id],
      },
    },
  ],
};
