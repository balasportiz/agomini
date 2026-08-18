"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CloudUpload, HardDriveUpload, Trash2, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deleteDoc, getDriveImportModes, importFromDrive, updateDoc, uploadMedia, type DriveImportMode } from "@/components/studio/studio-api";
import type { StudioMediaOption } from "@/lib/studio-data";

type MediaRow = StudioMediaOption & { caption: string; featured: boolean; updatedAt: string };

const MODE_LABELS: Record<DriveImportMode, string> = {
  "api-key": "Public link (anyone with the link)",
  "service-account": "Private Drive (shared with service account)",
};

export function MediaManager({ initialItems }: { initialItems: MediaRow[] }) {
  const router = useRouter();
  const [items, setItems] = useState<MediaRow[]>(initialItems);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MediaRow | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    let ok = 0;
    const failures: string[] = [];
    for (const file of Array.from(files)) {
      try {
        await uploadMedia(file);
        ok += 1;
      } catch (error) {
        failures.push(`${file.name}: ${error instanceof Error ? error.message : "failed"}`);
      }
    }
    setUploading(false);
    if (ok > 0) toast.success(`Uploaded ${ok} photo${ok === 1 ? "" : "s"}. They start hidden — switch them Live when you are ready to publish.`);
    for (const f of failures) toast.error(f);
    if (ok > 0) router.refresh();
  }

  return (
    <div className="studio-content__inner studio-content__inner--wide">
      <div className="studio-page-head" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          <h2>Photo gallery</h2>
          <p>Upload and manage photos. New photos start hidden; switch them Live when they are ready to appear publicly. Descriptions and captions are optional.</p>
        </div>
        <a href="/gallery" target="_blank" rel="noreferrer" className="studio-hint" style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", textDecoration: "underline", whiteSpace: "nowrap" }}>
          Open /gallery ↗
        </a>
      </div>

      <div className="studio-grid studio-grid--2" style={{ marginBottom: "1.25rem" }}>
        <div
          className="studio-drop"
          data-drag={dragging}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
        >
          <UploadCloud aria-hidden="true" />
          <strong>Drag photos here</strong>
          <span className="studio-hint">or upload from your device — JPEG, PNG or WebP</span>
          <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => handleFiles(e.target.files)} />
          <Button variant="outline" size="sm" disabled={uploading} onClick={() => fileInput.current?.click()}>
            <CloudUpload /> {uploading ? "Uploading…" : "Choose photos"}
          </Button>
        </div>
        <DriveImport onImported={() => router.refresh()} />
      </div>

      {items.length === 0 ? (
        <div className="studio-card"><div className="studio-empty"><p>No photos yet. Upload some above to get started.</p></div></div>
      ) : (
        <div className="studio-gallery">
          {items.map((item) => (
            <MediaCard
              key={item.id}
              item={item}
              onChange={(patch) => setItems((prev) => prev.map((it) => (it.id === item.id ? { ...it, ...patch } : it)))}
              onDelete={() => setDeleteTarget(item)}
              onSaved={() => router.refresh()}
            />
          ))}
        </div>
      )}

      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this photo?</AlertDialogTitle>
            <AlertDialogDescription>It will be removed from the site and anywhere it’s used. This can’t be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={async () => {
                if (!deleteTarget) return;
                try {
                  await deleteDoc("media", deleteTarget.id);
                  setItems((prev) => prev.filter((it) => it.id !== deleteTarget.id));
                  toast.success("Photo deleted.");
                  router.refresh();
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Could not delete.");
                } finally {
                  setDeleteTarget(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function MediaCard({ item, onChange, onDelete, onSaved }: { item: MediaRow; onChange: (patch: Partial<MediaRow>) => void; onDelete: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  async function persist(patch: Partial<MediaRow>) {
    setSaving(true);
    try {
      await updateDoc("media", item.id, {
        altText: patch.altText ?? item.altText,
        caption: patch.caption ?? item.caption,
        active: patch.active ?? item.active,
        featured: patch.featured ?? item.featured,
      });
      onSaved();
      setDirty(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save this photo.");
      // revert optimistic toggle
      if (patch.active !== undefined) onChange({ active: !patch.active });
      if (patch.featured !== undefined) onChange({ featured: !patch.featured });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="studio-gallery__item">
      <div className="studio-gallery__media">
        <Image src={item.url} alt={item.altText || item.filename} width={320} height={240} unoptimized />
      </div>
      <div className="studio-gallery__body">
        <div className="studio-field-row">
          <Label style={{ fontSize: "0.8rem" }}>Accessibility description (optional)</Label>
          <Input value={item.altText} placeholder="Used by screen readers; not displayed" onChange={(e) => { onChange({ altText: e.target.value }); setDirty(true); }} />
        </div>
        <div className="studio-field-row">
          <Label style={{ fontSize: "0.8rem" }}>Visible caption (optional)</Label>
          <Input value={item.caption} placeholder="Text displayed with the photograph" onChange={(e) => { onChange({ caption: e.target.value }); setDirty(true); }} />
        </div>
        <div className="studio-gallery__row-actions">
          <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem", cursor: "pointer" }} title="Show on website">
            <Switch checked={item.active} onCheckedChange={(v) => { onChange({ active: v }); persist({ active: v }); }} />
            {item.active ? "Live" : "Hidden"}
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem", cursor: "pointer" }} title="Feature this photo">
            <Switch checked={item.featured} onCheckedChange={(v) => { onChange({ featured: v }); persist({ featured: v }); }} />
            Featured
          </label>
        </div>
        <div className="studio-gallery__row-actions" style={{ marginTop: "0.6rem" }}>
          <Button size="sm" variant="outline" disabled={!dirty || saving} onClick={() => persist({})}>{saving ? "Saving…" : "Save"}</Button>
          <Button size="icon-sm" variant="ghost" aria-label="Delete photo" onClick={onDelete}><Trash2 /></Button>
        </div>
      </div>
    </div>
  );
}

function DriveImport({ onImported }: { onImported: () => void }) {
  const [modes, setModes] = useState<DriveImportMode[] | null>(null);
  const [mode, setMode] = useState<DriveImportMode | "">("");
  const [link, setLink] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getDriveImportModes().then((m) => {
      setModes(m);
      if (m.length === 1) setMode(m[0]);
    });
  }, []);

  async function handleImport() {
    if (!link.trim() || !mode) return;
    setBusy(true);
    try {
      const { imported, failures } = await importFromDrive(link.trim(), mode);
      if (imported > 0) toast.success(`Imported ${imported} photo${imported === 1 ? "" : "s"} from Google Drive.`);
      for (const f of failures) toast.error(`${f.name}: ${f.error ?? "failed"}`);
      if (imported > 0) { setLink(""); onImported(); }
      else if (failures.length === 0) toast.error("No importable photos were found at that link.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not import from Google Drive.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="studio-drop" style={{ alignItems: "stretch", textAlign: "left" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", justifyContent: "center" }}>
        <HardDriveUpload aria-hidden="true" />
        <strong>Import from Google Drive</strong>
      </div>
      {modes === null ? (
        <span className="studio-hint" style={{ textAlign: "center" }}>Checking available import methods…</span>
      ) : modes.length === 0 ? (
        <span className="studio-hint" style={{ textAlign: "center" }}>Google Drive import isn’t configured on the server yet.</span>
      ) : (
        <>
          <Input value={link} placeholder="Paste a Drive file or folder link" onChange={(e) => setLink(e.target.value)} disabled={busy} />
          {modes.length > 1 && (
            <select
              className="border-input flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
              value={mode}
              onChange={(e) => setMode(e.target.value as DriveImportMode)}
              disabled={busy}
            >
              <option value="" disabled>Choose an import method</option>
              {modes.map((m) => <option key={m} value={m}>{MODE_LABELS[m]}</option>)}
            </select>
          )}
          <Button variant="outline" size="sm" disabled={busy || !link.trim() || !mode} onClick={handleImport}>
            {busy ? "Importing…" : "Import photos"}
          </Button>
        </>
      )}
    </div>
  );
}
