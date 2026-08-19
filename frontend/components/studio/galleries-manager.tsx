"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { CloudUpload, HardDriveUpload, Home, Pencil, Plus, Trash2, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
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
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  createDoc,
  deleteDoc,
  getDriveImportModes,
  importFromDrive,
  updateDoc,
  updateGlobal,
  uploadMedia,
  type DriveImportMode,
} from "@/components/studio/studio-api";
import {
  createTransferMeter,
  TransferProgress,
  type TransferProgressState,
} from "@/components/studio/transfer-progress";
import type { StudioEdition, StudioGalleryPhoto } from "@/lib/studio-data";

const MODE_LABELS: Record<DriveImportMode, string> = {
  "api-key": "Public link (anyone with the link)",
  "service-account": "Private Drive (shared with service account)",
};

type EditionDraft = Pick<StudioEdition, "name" | "editionLabel" | "slug" | "eventDate" | "galleryDescription" | "active">;
const emptyEdition: EditionDraft = { name: "", editionLabel: "", slug: "", eventDate: "", galleryDescription: "", active: false };

function slugify(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function studioPhotoSrc(id: string): string {
  return `/api/photos/${encodeURIComponent(id)}/source`;
}

export function GalleriesManager({
  initialEditions,
  initialPhotos,
  initialFeaturedEditionId,
}: {
  initialEditions: StudioEdition[];
  initialPhotos: StudioGalleryPhoto[];
  initialFeaturedEditionId: string | null;
}) {
  const router = useRouter();
  const [editions, setEditions] = useState(initialEditions);
  const [photos, setPhotos] = useState(initialPhotos);
  const [selectedId, setSelectedId] = useState(initialFeaturedEditionId ?? initialEditions[0]?.id ?? null);
  const [featuredId, setFeaturedId] = useState(initialFeaturedEditionId);
  const [editionDialog, setEditionDialog] = useState<"new" | "edit" | null>(null);
  const [editionDraft, setEditionDraft] = useState<EditionDraft>(emptyEdition);
  const [savingEdition, setSavingEdition] = useState(false);
  const [deleteEdition, setDeleteEdition] = useState<StudioEdition | null>(null);
  const [deletePhoto, setDeletePhoto] = useState<StudioGalleryPhoto | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<TransferProgressState | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const selected = editions.find((edition) => edition.id === selectedId) ?? null;
  const selectedPhotos = useMemo(
    () =>
      photos.filter((photo) => {
        if (photo.galleryEditionId === selectedId) return true;
        if (photo.galleryEditionId) return false;
        if (photo.assetType !== "event-gallery") return false;
        return editions.length === 1;
      }),
    [photos, selectedId, editions.length],
  );
  const hiddenSelectedCount = selectedPhotos.filter((photo) => !photo.active).length;

  function openNewEdition() {
    setEditionDraft(emptyEdition);
    setEditionDialog("new");
  }

  function openEditEdition() {
    if (!selected) return;
    setEditionDraft({
      name: selected.name,
      editionLabel: selected.editionLabel,
      slug: selected.slug,
      eventDate: selected.eventDate,
      galleryDescription: selected.galleryDescription,
      active: selected.active,
    });
    setEditionDialog("edit");
  }

  async function saveEdition() {
    if (!editionDraft.name.trim() || !editionDraft.editionLabel.trim() || !editionDraft.slug.trim()) {
      toast.error("Add an edition name, short label and URL slug.");
      return;
    }
    setSavingEdition(true);
    const data = {
      ...editionDraft,
      name: editionDraft.name.trim(),
      editionLabel: editionDraft.editionLabel.trim(),
      slug: slugify(editionDraft.slug),
      eventDate: editionDraft.eventDate || null,
      galleryDescription: editionDraft.galleryDescription.trim(),
    };
    try {
      if (editionDialog === "new") {
        const { id } = await createDoc("event-editions", { ...data, resultsPublished: false });
        const next: StudioEdition = { ...data, id, eventDate: data.eventDate ?? "", resultsUrl: "", resultsPublished: false };
        setEditions((current) => [next, ...current]);
        setSelectedId(id);
        toast.success("Edition created. Add its photographs below.");
      } else if (selected) {
        await updateDoc("event-editions", selected.id, data);
        setEditions((current) => current.map((edition) => edition.id === selected.id ? { ...edition, ...data, eventDate: data.eventDate ?? "" } : edition));
        toast.success("Gallery edition saved.");
      }
      setEditionDialog(null);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save this edition.");
    } finally {
      setSavingEdition(false);
    }
  }

  async function confirmDeleteEdition() {
    if (!deleteEdition) return;
    try {
      await deleteDoc("event-editions", deleteEdition.id);
      const remaining = editions.filter((edition) => edition.id !== deleteEdition.id);
      setEditions(remaining);
      setSelectedId(remaining[0]?.id ?? null);
      if (featuredId === deleteEdition.id) setFeaturedId(null);
      toast.success("Edition deleted. Its image files remain safely stored but are detached from the public archive.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete this edition.");
    } finally {
      setDeleteEdition(null);
    }
  }

  async function makeHomepageEdition() {
    if (!selected) return;
    try {
      await updateGlobal("site-settings", { featuredGalleryEdition: selected.id });
      setFeaturedId(selected.id);
      toast.success(`${selected.name} now appears in the homepage gallery preview.`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update the homepage gallery.");
    }
  }

  async function handleFiles(files: FileList | null) {
    if (!selected || !files?.length) return;
    const selectedFiles = Array.from(files);
    const totalBytes = selectedFiles.reduce((sum, file) => sum + file.size, 0);
    const reportProgress = createTransferMeter("upload", setUploadProgress);
    let completedBytes = 0;
    let imported = 0;

    setUploading(true);
    reportProgress({
      phase: "preparing",
      label: `Preparing ${selectedFiles.length} photo${selectedFiles.length === 1 ? "" : "s"}`,
      currentName: selectedFiles[0]?.name ?? "",
      completedItems: 0,
      totalItems: selectedFiles.length,
      transferredBytes: 0,
      totalBytes,
    });

    for (const [index, file] of selectedFiles.entries()) {
      try {
        const uploaded = await uploadMedia(file, {
          altText: "",
          active: false,
          featured: false,
          assetType: "event-gallery",
          showInGallery: true,
          galleryEdition: selected.id,
        }, ({ loaded, total, phase }) => {
          const fileRatio = total > 0 ? Math.min(1, loaded / total) : 0;
          const fileBytes = phase === "processing" ? file.size : Math.round(file.size * fileRatio);
          reportProgress({
            phase: phase === "processing" ? "processing" : "transferring",
            label: phase === "processing"
              ? `Processing ${index + 1} of ${selectedFiles.length}`
              : `Uploading ${index + 1} of ${selectedFiles.length}`,
            currentName: file.name,
            completedItems: index,
            totalItems: selectedFiles.length,
            transferredBytes: completedBytes + fileBytes,
            totalBytes,
          });
        });
        try {
          await updateDoc("media", uploaded.id, {
            altText: "",
            active: false,
            featured: false,
            assetType: "event-gallery",
            showInGallery: true,
            galleryEdition: selected.id,
          });
        } catch (error) {
          console.error("[studio] could not attach uploaded photo to this edition", error);
        }
        const nextPhoto: StudioGalleryPhoto = {
          id: uploaded.id,
          url: studioPhotoSrc(uploaded.id),
          altText: "",
          filename: uploaded.filename,
          active: false,
          caption: "",
          featured: false,
          showInGallery: true,
          galleryEditionId: selected.id,
          assetType: "event-gallery",
          updatedAt: new Date().toISOString(),
        };
        setPhotos((current) => [nextPhoto, ...current.filter((photo) => photo.id !== nextPhoto.id)]);
        imported += 1;
      } catch (error) {
        toast.error(`${file.name}: ${error instanceof Error ? error.message : "upload failed"}`);
      }
      completedBytes += file.size;
      reportProgress({
        phase: index === selectedFiles.length - 1 ? "complete" : "transferring",
        label: index === selectedFiles.length - 1 ? "Upload complete" : `Starting ${index + 2} of ${selectedFiles.length}`,
        currentName: index === selectedFiles.length - 1 ? "" : selectedFiles[index + 1]?.name ?? "",
        completedItems: index + 1,
        totalItems: selectedFiles.length,
        transferredBytes: completedBytes,
        totalBytes,
      });
    }

    setUploading(false);
    if (imported > 0) {
      toast.success(`Uploaded ${imported} photo${imported === 1 ? "" : "s"}. Switch them Live when you are ready to publish.`);
      router.refresh();
    }
  }

  async function persistPhoto(photo: StudioGalleryPhoto, patch: Partial<StudioGalleryPhoto>) {
    const next = { ...photo, ...patch };
    setPhotos((current) => current.map((item) => item.id === photo.id ? next : item));
    try {
      await updateDoc("media", photo.id, {
        altText: next.altText,
        caption: next.caption,
        active: next.active,
        featured: next.featured,
        assetType: "event-gallery",
        showInGallery: next.showInGallery,
        galleryEdition: next.galleryEditionId,
      });
      toast.success("Photo saved.");
      router.refresh();
    } catch (error) {
      setPhotos((current) => current.map((item) => item.id === photo.id ? photo : item));
      toast.error(error instanceof Error ? error.message : "Could not save this photo.");
    }
  }

  async function confirmDeletePhoto() {
    if (!deletePhoto) return;
    try {
      await deleteDoc("media", deletePhoto.id);
      setPhotos((current) => current.filter((photo) => photo.id !== deletePhoto.id));
      toast.success("Photo deleted.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete this photo.");
    } finally {
      setDeletePhoto(null);
    }
  }

  return (
    <div className="studio-content__inner studio-content__inner--wide studio-editions">
      <div className="studio-page-head studio-page-head--actions">
        <div>
          <h2>Gallery editions</h2>
          <p>Keep every race archive separate. Choose an edition, then upload, publish, feature or delete only the photographs that belong to it.</p>
        </div>
        <Button onClick={openNewEdition}><Plus /> Add edition</Button>
      </div>

      {editions.length === 0 ? (
        <div className="studio-card studio-empty">
          <p>No event editions yet. Create the first edition before uploading photographs.</p>
          <Button variant="outline" onClick={openNewEdition}><Plus /> Create first edition</Button>
        </div>
      ) : (
        <>
          <div className="studio-edition-switcher" role="tablist" aria-label="Gallery editions">
            {editions.map((edition) => (
              <button key={edition.id} type="button" role="tab" aria-selected={selectedId === edition.id} data-active={selectedId === edition.id} onClick={() => setSelectedId(edition.id)}>
                <strong>{edition.editionLabel}</strong>
                <span>{edition.name}</span>
                {!edition.active && <small>Draft</small>}
              </button>
            ))}
          </div>

          {selected && (
            <>
              <section className="studio-edition-hero" aria-labelledby="selected-edition-title">
                <div>
                  <span className="studio-edition-hero__label">Selected archive · {selectedPhotos.length} photos</span>
                  <h3 id="selected-edition-title">{selected.name}</h3>
                  <p>{selected.galleryDescription || "Add an edition introduction to give visitors context for this photo archive."}</p>
                </div>
                <div className="studio-edition-hero__actions">
                  {featuredId === selected.id ? <span className="studio-badge studio-badge--on"><Home /> Homepage edition</span> : <Button variant="outline" onClick={makeHomepageEdition}><Home /> Use on homepage</Button>}
                  <Button variant="outline" onClick={openEditEdition}><Pencil /> Edit edition</Button>
                  <Button variant="ghost" onClick={() => setDeleteEdition(selected)}><Trash2 /> Delete edition</Button>
                </div>
              </section>

              <div className="studio-grid studio-grid--2 studio-gallery-tools">
                <div
                  className="studio-drop"
                  data-drag={dragging}
                  onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(event) => { event.preventDefault(); setDragging(false); handleFiles(event.dataTransfer.files); }}
                >
                  <UploadCloud aria-hidden="true" />
                  <strong>Upload to {selected.editionLabel}</strong>
                  <span className="studio-hint">Drag photos here, or choose JPEG, PNG or WebP files.</span>
                  <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(event) => handleFiles(event.target.files)} />
                  <Button variant="outline" size="sm" disabled={uploading} onClick={() => fileInput.current?.click()}>
                    <CloudUpload /> {uploading ? "Uploading…" : "Choose photos"}
                  </Button>
                  <TransferProgress progress={uploadProgress} />
                </div>
                <EditionDriveImport editionId={selected.id} editionLabel={selected.editionLabel} onImported={() => router.refresh()} />
              </div>

              {hiddenSelectedCount > 0 && (
                <div className="studio-publish-note" role="status">
                  <strong>{hiddenSelectedCount} photo{hiddenSelectedCount === 1 ? " is" : "s are"} hidden from the homepage and gallery</strong>
                  <span>Change <b>Hidden</b> to <b>Live</b> first — then <b>Featured</b> puts a photo on the homepage preview and <b>In gallery</b> puts it on this edition&rsquo;s gallery page.</span>
                </div>
              )}

              {selectedPhotos.length === 0 ? (
                <div className="studio-card studio-empty"><p>No photographs in {selected.name} yet. Upload from your device or import a Drive folder above.</p></div>
              ) : (
                <div className="studio-gallery">
                  {selectedPhotos.map((photo) => (
                    <EditionPhotoCard key={photo.id} photo={photo} onSave={(patch) => persistPhoto(photo, patch)} onDelete={() => setDeletePhoto(photo)} />
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}

      <Dialog open={editionDialog !== null} onOpenChange={(open) => !open && setEditionDialog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editionDialog === "new" ? "Add gallery edition" : "Edit gallery edition"}</DialogTitle></DialogHeader>
          <div className="studio-dialog-body">
            <div className="studio-field-row"><Label>Edition name *</Label><Input value={editionDraft.name} placeholder="Agomoni Run 2.0" onChange={(event) => setEditionDraft((current) => ({ ...current, name: event.target.value }))} /></div>
            <div className="studio-edition-form-grid">
              <div className="studio-field-row"><Label>Short label *</Label><Input value={editionDraft.editionLabel} placeholder="2.0" onChange={(event) => setEditionDraft((current) => ({ ...current, editionLabel: event.target.value }))} /></div>
              <div className="studio-field-row"><Label>URL slug *</Label><Input value={editionDraft.slug} placeholder="agomoni-run-2-0" onChange={(event) => setEditionDraft((current) => ({ ...current, slug: slugify(event.target.value) }))} /></div>
            </div>
            <div className="studio-field-row"><Label>Event date</Label><Input type="date" value={editionDraft.eventDate ? editionDraft.eventDate.slice(0, 10) : ""} onChange={(event) => setEditionDraft((current) => ({ ...current, eventDate: event.target.value }))} /></div>
            <div className="studio-field-row"><Label>Gallery introduction</Label><Textarea rows={4} value={editionDraft.galleryDescription} placeholder="A short, factual introduction to this edition…" onChange={(event) => setEditionDraft((current) => ({ ...current, galleryDescription: event.target.value }))} /></div>
            <label className="studio-toggle-line"><Switch checked={editionDraft.active} onCheckedChange={(active) => setEditionDraft((current) => ({ ...current, active }))} /><span><strong>Show this edition publicly</strong><small>Hidden editions and their photos remain editable in Studio.</small></span></label>
          </div>
          <DialogFooter><Button variant="ghost" onClick={() => setEditionDialog(null)} disabled={savingEdition}>Cancel</Button><Button onClick={saveEdition} disabled={savingEdition}>{savingEdition ? "Saving…" : "Save edition"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteEdition !== null} onOpenChange={(open) => !open && setDeleteEdition(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete this edition?</AlertDialogTitle><AlertDialogDescription>“{deleteEdition?.name}” will disappear from Results and Gallery archives. Its image files remain safely stored but will be detached. This can’t be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Keep edition</AlertDialogCancel><AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90" onClick={confirmDeleteEdition}>Delete edition</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deletePhoto !== null} onOpenChange={(open) => !open && setDeletePhoto(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete this photo?</AlertDialogTitle><AlertDialogDescription>The image file will be permanently removed from this edition and the media library. This can’t be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Keep photo</AlertDialogCancel><AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90" onClick={confirmDeletePhoto}>Delete photo</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function EditionPhotoCard({ photo, onSave, onDelete }: { photo: StudioGalleryPhoto; onSave: (patch: Partial<StudioGalleryPhoto>) => Promise<void>; onDelete: () => void }) {
  const [altText, setAltText] = useState(photo.altText);
  const [caption, setCaption] = useState(photo.caption);
  const dirty = altText !== photo.altText || caption !== photo.caption;

  return (
    <article className="studio-gallery__item">
      <div className="studio-gallery__media"><Image src={photo.url} alt={photo.altText || photo.filename} width={480} height={360} unoptimized /></div>
      <div className="studio-gallery__body">
        <div className="studio-field-row">
          <Label>Accessibility description (optional)</Label>
          <Input value={altText} placeholder="Describe the people, action and setting" onChange={(event) => setAltText(event.target.value)} />
          <span className="studio-hint">Not displayed on the website. Screen readers use this text; use the caption below for visible words.</span>
        </div>
        <div className="studio-field-row">
          <Label>Visible caption (optional)</Label>
          <Input value={caption} placeholder="Text displayed with the photograph" onChange={(event) => setCaption(event.target.value)} />
        </div>
        <div className="studio-photo-switches">
          <label title="Master switch — turn off to hide this photo everywhere on the public site"><Switch checked={photo.active} onCheckedChange={(active) => onSave({ active, altText, caption })} /><span>{photo.active ? "Live" : "Hidden"}</span></label>
          <label title="Show this photo in the homepage gallery preview"><Switch checked={photo.featured} onCheckedChange={(featured) => onSave({ featured, altText, caption })} /><span>Featured</span></label>
          <label title="Show this photo on this edition's gallery page"><Switch checked={photo.showInGallery} onCheckedChange={(showInGallery) => onSave({ showInGallery, altText, caption })} /><span>In gallery</span></label>
        </div>
        <div className="studio-gallery__row-actions"><Button size="sm" variant="outline" disabled={!dirty} onClick={() => onSave({ altText, caption })}>Save text</Button><Button size="icon-sm" variant="ghost" aria-label="Delete photo" onClick={onDelete}><Trash2 /></Button></div>
      </div>
    </article>
  );
}

function EditionDriveImport({ editionId, editionLabel, onImported }: { editionId: string; editionLabel: string; onImported: () => void }) {
  const [modes, setModes] = useState<DriveImportMode[] | null>(null);
  const [mode, setMode] = useState<DriveImportMode | "">("");
  const [link, setLink] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<TransferProgressState | null>(null);

  useEffect(() => { getDriveImportModes().then((available) => { setModes(available); if (available.length === 1) setMode(available[0]); }); }, []);

  async function handleImport() {
    if (!link.trim() || !mode) return;
    const reportProgress = createTransferMeter("download", setProgress);
    setBusy(true);
    reportProgress({
      phase: "preparing",
      label: "Scanning Drive folder…",
      currentName: "",
      completedItems: 0,
      totalItems: 0,
      transferredBytes: 0,
      totalBytes: 0,
    });

    try {
      const { imported, failures } = await importFromDrive(link.trim(), mode, editionId, (event) => {
        reportProgress({
          phase: event.phase === "downloading"
            ? "transferring"
            : event.phase === "processing"
              ? "processing"
              : "complete",
          label: event.phase === "downloading"
            ? `Downloading ${event.currentFile} of ${event.totalFiles}`
            : event.phase === "processing"
              ? `Saving ${event.currentFile} of ${event.totalFiles}`
              : "Import complete",
          currentName: event.fileName,
          completedItems: event.completedFiles,
          totalItems: event.totalFiles,
          transferredBytes: event.transferredBytes,
          totalBytes: event.totalBytes,
        });
      });
      if (imported > 0) {
        toast.success(`Imported ${imported} photo${imported === 1 ? "" : "s"} into ${editionLabel}. Switch them Live when you are ready to publish.`);
      }
      failures.forEach((failure) => toast.error(`${failure.name}: ${failure.error ?? "failed"}`));
      if (imported > 0) { setLink(""); onImported(); }
      else if (failures.length === 0) toast.error("No importable photos were found at that link.");
    } catch (error) {
      setProgress(null);
      toast.error(error instanceof Error ? error.message : "Could not import from Google Drive.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="studio-drop studio-drive-import">
      <div className="studio-drive-import__title"><HardDriveUpload aria-hidden="true" /><strong>Import Drive folder to {editionLabel}</strong></div>
      {modes === null ? <span className="studio-hint">Checking available import methods…</span> : modes.length === 0 ? <span className="studio-hint">Google Drive import isn’t configured on this server yet.</span> : <>
        <Input value={link} placeholder="Paste a Drive file or folder link" onChange={(event) => setLink(event.target.value)} disabled={busy} />
        {modes.length > 1 && <select value={mode} onChange={(event) => setMode(event.target.value as DriveImportMode)} disabled={busy}><option value="" disabled>Choose an import method</option>{modes.map((item) => <option key={item} value={item}>{MODE_LABELS[item]}</option>)}</select>}
        <Button variant="outline" size="sm" disabled={busy || !link.trim() || !mode} onClick={handleImport}>{busy ? "Importing…" : "Import photos"}</Button>
        <TransferProgress progress={progress} />
      </>}
    </div>
  );
}
