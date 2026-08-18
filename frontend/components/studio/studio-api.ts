"use client";

/**
 * Thin client-side wrapper over Payload's REST API. Every call sends the auth
 * cookie, so Payload enforces the same role-based access control as elsewhere,
 * and successful writes fire the afterChange/afterDelete hooks that broadcast
 * live updates to the public site (no refresh needed).
 */

const API = "/api";

type PayloadError = {
  error?: string;
  errors?: { message?: string; data?: { message?: string } }[];
  message?: string;
};

function parseErrorText(text: string, fallback: string): string {
  try {
    const data = JSON.parse(text) as PayloadError;
    const nested = data.errors?.[0]?.data?.message;
    const message = data.errors?.[0]?.message || nested || data.error || data.message;
    if (typeof message === "string" && message.trim()) return message;
  } catch {
    if (text && text.length < 400 && !text.trim().startsWith("<")) return text;
  }
  return fallback;
}

async function parseError(response: Response, fallback: string): Promise<string> {
  return parseErrorText(await response.text(), fallback);
}

export async function updateGlobal(slug: string, data: Record<string, unknown>): Promise<void> {
  const response = await fetch(`${API}/globals/${slug}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error(await parseError(response, "Could not save your changes."));
}

export async function createDoc(collection: string, data: Record<string, unknown>): Promise<{ id: string }> {
  const response = await fetch(`${API}/${collection}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error(await parseError(response, "Could not create this item."));
  const result = await response.json();
  return { id: String(result?.doc?.id ?? result?.id ?? "") };
}

export async function changeOwnPassword(currentPassword: string, newPassword: string): Promise<void> {
  const response = await fetch(`${API}/users/change-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  if (!response.ok) throw new Error(await parseError(response, "Could not update your password."));
}

export async function updateDoc(collection: string, id: string, data: Record<string, unknown>): Promise<void> {
  const response = await fetch(`${API}/${collection}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error(await parseError(response, "Could not save your changes."));
}

export async function deleteDoc(collection: string, id: string): Promise<void> {
  const response = await fetch(`${API}/${collection}/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!response.ok) throw new Error(await parseError(response, "Could not delete this item."));
}

export type MediaUploadProgress = {
  loaded: number;
  total: number;
  phase: "uploading" | "processing";
};

export function uploadMedia(
  file: File,
  data?: Record<string, unknown>,
  onProgress?: (progress: MediaUploadProgress) => void,
): Promise<{ id: string; filename: string }> {
  const form = new FormData();
  form.append("file", file);
  if (data) form.append("_payload", JSON.stringify(data));

  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", `${API}/media`);
    request.withCredentials = true;
    request.upload.addEventListener("progress", (event) => {
      if (!event.lengthComputable) return;
      onProgress?.({ loaded: event.loaded, total: event.total, phase: "uploading" });
    });
    request.upload.addEventListener("load", () => {
      onProgress?.({ loaded: file.size, total: file.size, phase: "processing" });
    });
    request.addEventListener("load", () => {
      if (request.status < 200 || request.status >= 300) {
        reject(new Error(parseErrorText(request.responseText, `Could not upload ${file.name}.`)));
        return;
      }
      try {
        const result = JSON.parse(request.responseText) as {
          doc?: { id?: unknown; filename?: unknown };
          id?: unknown;
        };
        const id = String(result?.doc?.id ?? result?.id ?? "");
        if (!id) {
          reject(new Error(`The server saved ${file.name} without returning an id.`));
          return;
        }
        const filename =
          typeof result.doc?.filename === "string" ? result.doc.filename : file.name;
        resolve({ id, filename });
      } catch {
        reject(new Error(`The server returned an invalid response for ${file.name}.`));
      }
    });
    request.addEventListener("error", () => reject(new Error(`The network connection failed while uploading ${file.name}.`)));
    request.addEventListener("abort", () => reject(new Error(`The upload of ${file.name} was cancelled.`)));
    request.send(form);
  });
}

export type DriveImportMode = "api-key" | "service-account";

export async function getDriveImportModes(): Promise<DriveImportMode[]> {
  const response = await fetch(`${API}/media/drive-import-modes`, { credentials: "include" });
  if (!response.ok) return [];
  const data = await response.json();
  return Array.isArray(data?.modes) ? data.modes : [];
}

export type DriveImportProgress = {
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

type DriveImportResult = { name: string; status: "imported" | "failed"; error?: string };
type DriveImportStreamEvent =
  | ({ type: "progress" } & DriveImportProgress)
  | { type: "complete"; results: DriveImportResult[] }
  | { type: "error"; error: string };

export async function importFromDrive(
  link: string,
  mode: DriveImportMode,
  editionId?: string,
  onProgress?: (progress: DriveImportProgress) => void,
): Promise<{ imported: number; failures: { name: string; error?: string }[] }> {
  const response = await fetch(`${API}/media/drive-import`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ link, mode, editionId }),
  });
  if (!response.ok) throw new Error(await parseError(response, "Could not import from Google Drive."));
  if (!response.body) throw new Error("This browser cannot read Google Drive import progress.");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffered = "";
  let results: DriveImportResult[] = [];
  let completed = false;

  const consumeLine = (line: string) => {
    if (!line.trim()) return;
    const event = JSON.parse(line) as DriveImportStreamEvent;
    if (event.type === "progress") onProgress?.(event);
    if (event.type === "complete") {
      results = event.results;
      completed = true;
    }
    if (event.type === "error") throw new Error(event.error);
  };

  while (true) {
    const { done, value } = await reader.read();
    buffered += decoder.decode(value, { stream: !done });
    const lines = buffered.split("\n");
    buffered = lines.pop() ?? "";
    for (const line of lines) consumeLine(line);
    if (done) break;
  }
  if (buffered.trim()) consumeLine(buffered);
  if (!completed) throw new Error("The Google Drive import ended before the server returned a result.");

  return {
    imported: results.filter((result) => result.status === "imported").length,
    failures: results
      .filter((result) => result.status === "failed")
      .map((result) => ({ name: result.name, error: result.error })),
  };
}
