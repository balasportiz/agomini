import { drive_v3, drive as driveFactory } from "@googleapis/drive";
import { GoogleAuth } from "google-auth-library";
import { getServerEnv } from "@/lib/env";

const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.readonly";

export type DriveImportMode = "api-key" | "service-account";

export type DriveSourceFile = {
  id: string;
  name: string;
  mimeType: string;
  size?: number;
};

export type DriveDownloadedFile = {
  id: string;
  name: string;
  mimeType: string;
  data: Buffer;
  size: number;
};

export type DriveDownloadProgress = {
  loaded: number;
  total: number;
};

/** Which Drive import strategies are usable given the configured credentials. */
export function getAvailableDriveImportModes(): DriveImportMode[] {
  const env = getServerEnv();
  const modes: DriveImportMode[] = [];
  if (env.GOOGLE_DRIVE_API_KEY) modes.push("api-key");
  if (env.GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON) modes.push("service-account");
  return modes;
}

let cachedServiceAccountAuth: GoogleAuth | undefined;

function getServiceAccountAuth(serviceAccountJson: string): GoogleAuth {
  if (cachedServiceAccountAuth) return cachedServiceAccountAuth;
  let credentials: Record<string, unknown>;
  try {
    credentials = JSON.parse(serviceAccountJson);
  } catch {
    throw new Error("GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON is not valid JSON.");
  }
  cachedServiceAccountAuth = new GoogleAuth({ credentials, scopes: [DRIVE_SCOPE] });
  return cachedServiceAccountAuth;
}

/**
 * Builds an authenticated Drive client for the requested mode.
 *
 * - "api-key": works only for files/folders shared "Anyone with the link" —
 *   no user consent flow, but Google will 404 anything not public.
 * - "service-account": works for files/folders explicitly shared with the
 *   service account's own email address (found in the JSON key as
 *   `client_email`), including entirely private Drives.
 */
async function getDriveClient(mode: DriveImportMode): Promise<drive_v3.Drive> {
  const env = getServerEnv();
  if (mode === "api-key") {
    if (!env.GOOGLE_DRIVE_API_KEY) throw new Error("GOOGLE_DRIVE_API_KEY is not configured.");
    return driveFactory({ version: "v3", auth: env.GOOGLE_DRIVE_API_KEY });
  }
  if (!env.GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON) throw new Error("GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON is not configured.");
  const auth = getServiceAccountAuth(env.GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON);
  const authClient = await auth.getClient();
  // `@googleapis/drive` resolves its own `google-auth-library` copy (pinned
  // internally via googleapis-common), which can differ from the version
  // resolved for this direct import. The auth client is structurally
  // compatible at runtime; this cast only bridges the two type identities.
  return driveFactory({ version: "v3", auth: authClient as unknown as drive_v3.Options["auth"] });
}

/**
 * Extracts a Drive file or folder ID from any of the common shareable-link
 * shapes, or returns the input unchanged if it already looks like a bare ID.
 *
 * Supported shapes:
 *   https://drive.google.com/file/d/FILE_ID/view?usp=sharing
 *   https://drive.google.com/open?id=FILE_ID
 *   https://drive.google.com/drive/folders/FOLDER_ID?usp=sharing
 *   https://drive.google.com/uc?id=FILE_ID&export=download
 */
export function extractDriveId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const patterns = [/\/file\/d\/([\w-]+)/, /\/folders\/([\w-]+)/, /[?&]id=([\w-]+)/];
  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match?.[1]) return match[1];
  }

  // Bare Drive IDs are alphanumeric plus - and _, typically 25+ characters.
  if (/^[\w-]{10,}$/.test(trimmed)) return trimmed;
  return null;
}

const FOLDER_MIME_TYPE = "application/vnd.google-apps.folder";
const IMPORTABLE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function parseDriveSize(value: string | null | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : undefined;
}

/**
 * Resolves a Drive link/ID to the flat list of importable image files.
 * If the ID points at a single file, returns that one file (if it's an
 * importable image). If it points at a folder, lists direct children only
 * (no recursive descent into sub-folders).
 */
export async function listDriveImportCandidates(
  linkOrId: string,
  mode: DriveImportMode,
): Promise<DriveSourceFile[]> {
  const id = extractDriveId(linkOrId);
  if (!id) throw new Error("Could not find a Google Drive file or folder ID in that link.");

  const drive = await getDriveClient(mode);
  const meta = await drive.files.get({ fileId: id, fields: "id, name, mimeType, size" }).catch((error) => {
    throw new Error(describeDriveError(error, mode));
  });

  if (meta.data.mimeType === FOLDER_MIME_TYPE) {
    const listing = await drive.files.list({
      q: `'${id}' in parents and trashed = false`,
      fields: "files(id, name, mimeType, size)",
      pageSize: 200,
      spaces: "drive",
    });
    return (listing.data.files ?? [])
      .filter((file) => file.mimeType && IMPORTABLE_MIME_TYPES.has(file.mimeType))
      .map((file) => ({
        id: file.id!,
        name: file.name ?? "photo",
        mimeType: file.mimeType!,
        size: parseDriveSize(file.size),
      }));
  }

  if (!meta.data.mimeType || !IMPORTABLE_MIME_TYPES.has(meta.data.mimeType)) {
    throw new Error("That Drive file isn't a JPEG, PNG or WebP image.");
  }
  return [{
    id: meta.data.id!,
    name: meta.data.name ?? "photo",
    mimeType: meta.data.mimeType,
    size: parseDriveSize(meta.data.size),
  }];
}

/** Downloads a single Drive file while reporting the bytes received. */
export async function downloadDriveFile(
  file: DriveSourceFile,
  mode: DriveImportMode,
  onProgress?: (progress: DriveDownloadProgress) => void,
): Promise<DriveDownloadedFile> {
  const drive = await getDriveClient(mode);
  let response;
  try {
    response = await drive.files.get(
      { fileId: file.id, alt: "media" },
      { responseType: "stream" },
    );
  } catch (error) {
    throw new Error(describeDriveError(error, mode));
  }

  const chunks: Buffer[] = [];
  let loaded = 0;
  onProgress?.({ loaded, total: file.size ?? 0 });

  try {
    const stream = response.data as unknown as AsyncIterable<Buffer | Uint8Array | string>;
    for await (const chunk of stream) {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      chunks.push(buffer);
      loaded += buffer.byteLength;
      onProgress?.({ loaded, total: file.size ?? loaded });
    }
  } catch (error) {
    throw new Error(describeDriveError(error, mode));
  }

  const data = Buffer.concat(chunks, loaded);
  return { id: file.id, name: file.name, mimeType: file.mimeType, data, size: loaded };
}

function describeDriveError(error: unknown, mode: DriveImportMode): string {
  const status = (error as { code?: number; response?: { status?: number } })?.response?.status
    ?? (error as { code?: number })?.code;
  if (status === 404 && mode === "api-key") {
    return "File not found. With an API key, the file or folder must be shared as \u201cAnyone with the link\u201d.";
  }
  if (status === 404) {
    return "File not found, or it hasn't been shared with the service account's email address.";
  }
  if (status === 403) {
    return mode === "api-key"
      ? "Access denied. Share the file or folder as \u201cAnyone with the link\u201d, or use the service-account import method for private files."
      : "Access denied. Share the file or folder with the service account's email address (from the JSON key's client_email field).";
  }
  return error instanceof Error ? error.message : "Google Drive request failed.";
}
