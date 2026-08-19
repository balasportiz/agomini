"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronDown, ChevronUp, Pencil, Plus, Trash2, X } from "lucide-react";
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
import { MediaPicker } from "@/components/studio/media-picker";
import { SiteImageField } from "@/components/studio/site-image-field";
import { createDoc, deleteDoc, updateDoc } from "@/components/studio/studio-api";
import type { StudioMediaOption } from "@/lib/studio-data";

export type StudioFieldDef = {
  name: string;
  label: string;
  type: "text" | "textarea" | "url" | "date" | "select" | "toggle" | "media" | "string-list";
  required?: boolean;
  placeholder?: string;
  help?: string;
  options?: { value: string; label: string }[];
  mediaLabel?: string;
  /** Upload directly as an independent asset instead of picking gallery photos. */
  mediaAssetType?: "site" | "partner";
  itemLabel?: string;
};

type Row = Record<string, unknown>;

const str = (v: unknown, fallback = "") => (typeof v === "string" ? v : v == null ? fallback : String(v));
const rel = (v: unknown): string | null => {
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  if (v && typeof v === "object" && "id" in v) return String((v as { id: unknown }).id);
  return null;
};
function toLocalInput(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function fromLocalInput(local: string): string {
  if (!local) return "";
  const d = new Date(local);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString();
}

export function CollectionEditor({
  collection,
  singular,
  plural,
  description,
  titleField,
  subtitleField,
  fields,
  defaults,
  initialRows,
  mediaOptions,
  orderable = false,
}: {
  collection: string;
  singular: string;
  plural: string;
  description: string;
  titleField: string;
  subtitleField?: string;
  fields: StudioFieldDef[];
  defaults: Row;
  initialRows: Row[];
  mediaOptions: StudioMediaOption[];
  orderable?: boolean;
}) {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>(initialRows);
  const [mode, setMode] = useState<"new" | "edit" | null>(null);
  const [draft, setDraft] = useState<Row>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Row | null>(null);
  const [moving, setMoving] = useState(false);

  function openNew() {
    setDraft({ ...defaults });
    setEditingId(null);
    setMode("new");
  }
  function openEdit(row: Row) {
    // Normalise media/relationship + string-list fields into editable form values.
    const next: Row = { ...row };
    for (const f of fields) {
      if (f.type === "media") next[f.name] = rel(row[f.name]);
      if (f.type === "string-list") {
        const arr = Array.isArray(row[f.name]) ? (row[f.name] as Record<string, unknown>[]) : [];
        next[f.name] = arr.map((entry) => str(entry.item));
      }
    }
    setDraft(next);
    setEditingId(str(row.id));
    setMode("edit");
  }

  function setField(name: string, value: unknown) {
    setDraft((prev) => ({ ...prev, [name]: value }));
  }

  function serialize(input: Row): Row {
    const out: Row = { ...input };
    for (const f of fields) {
      if (f.type === "date" && !out[f.name]) out[f.name] = null;
      if (f.type === "string-list") {
        const list = Array.isArray(out[f.name]) ? (out[f.name] as string[]) : [];
        out[f.name] = list.filter((s) => s.trim()).map((item) => ({ item }));
      }
    }
    delete out.id;
    delete out._order;
    delete out.updatedAt;
    delete out.createdAt;
    return out;
  }

  async function handleSubmit() {
    setSaving(true);
    try {
      const data = serialize(draft);
      if (mode === "new") {
        const { id } = await createDoc(collection, data);
        setRows((prev) => [...prev, { ...draft, id }]);
        toast.success(`${singular} added. It's live on the site.`);
      } else if (editingId) {
        await updateDoc(collection, editingId, data);
        setRows((prev) => prev.map((r) => (str(r.id) === editingId ? { ...r, ...draft } : r)));
        toast.success("Saved. Your changes are live on the site.");
      }
      setMode(null);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(row: Row) {
    const id = str(row.id);
    const next = !(row.active !== false);
    try {
      await updateDoc(collection, id, { active: next });
      setRows((prev) => prev.map((r) => (str(r.id) === id ? { ...r, active: next } : r)));
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update visibility.");
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const id = str(deleteTarget.id);
    try {
      await deleteDoc(collection, id);
      setRows((prev) => prev.filter((r) => str(r.id) !== id));
      toast.success(`${singular} deleted.`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete.");
    } finally {
      setDeleteTarget(null);
    }
  }

  // Payload's orderable collections accept `_order` writes via PATCH; swapping
  // the neighbours' fractional keys moves the row and persists everywhere the
  // collection is sorted by _order (Studio lists and the public site).
  async function moveRow(row: Row, delta: -1 | 1) {
    const index = rows.findIndex((r) => str(r.id) === str(row.id));
    const neighbour = rows[index + delta];
    if (index < 0 || !neighbour) return;
    const rowOrder = row._order;
    const neighbourOrder = neighbour._order;
    if (typeof rowOrder !== "string" || typeof neighbourOrder !== "string") {
      toast.error("Reload the page once before reordering newly added items.");
      return;
    }
    setMoving(true);
    try {
      await updateDoc(collection, str(row.id), { _order: neighbourOrder });
      await updateDoc(collection, str(neighbour.id), { _order: rowOrder });
      setRows((prev) => {
        const next = [...prev];
        next[index] = { ...neighbour, _order: rowOrder };
        next[index + delta] = { ...row, _order: neighbourOrder };
        return next;
      });
      toast.success(`${singular} moved ${delta === -1 ? "up" : "down"}. It's live on the site.`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not reorder. Reload and try again.");
    } finally {
      setMoving(false);
    }
  }

  return (
    <div className="studio-content__inner">
      <div className="studio-page-head" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}>
        <div>
          <h2>{plural}</h2>
          <p>{description}</p>
        </div>
        <Button onClick={openNew}><Plus /> Add {singular.toLowerCase()}</Button>
      </div>

      <div className="studio-card">
        {rows.length === 0 ? (
          <div className="studio-empty">
            <p>No {plural.toLowerCase()} yet.</p>
            <Button variant="outline" size="sm" onClick={openNew}><Plus /> Add your first {singular.toLowerCase()}</Button>
          </div>
        ) : (
          <div className="studio-list">
            {rows.map((row, index) => {
              const active = row.active !== false;
              const subtitle = subtitleField ? str(row[subtitleField]) : "";
              return (
                <div className="studio-list__row" key={str(row.id)}>
                  <div className="studio-list__main">
                    <strong>{str(row[titleField]) || "(untitled)"}</strong>
                    {subtitle && <span>{subtitle}</span>}
                  </div>
                  <label className="studio-inline-actions" style={{ alignItems: "center", cursor: "pointer" }} title="Show on website">
                    <Switch checked={active} onCheckedChange={() => toggleActive(row)} aria-label="Show on website" />
                    <span className={`studio-badge ${active ? "studio-badge--on" : "studio-badge--off"}`}>{active ? "Live" : "Hidden"}</span>
                  </label>
                  <div className="studio-list__row-actions">
                    {orderable && (
                      <>
                        <Button variant="ghost" size="icon-sm" aria-label={`Move ${singular} up`} title="Move up" disabled={moving || index === 0} onClick={() => moveRow(row, -1)}><ChevronUp /></Button>
                        <Button variant="ghost" size="icon-sm" aria-label={`Move ${singular} down`} title="Move down" disabled={moving || index === rows.length - 1} onClick={() => moveRow(row, 1)}><ChevronDown /></Button>
                      </>
                    )}
                    <Button variant="outline" size="sm" onClick={() => openEdit(row)}><Pencil /> Edit</Button>
                    <Button variant="ghost" size="icon-sm" aria-label={`Delete ${singular}`} onClick={() => setDeleteTarget(row)}><Trash2 /></Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={mode !== null} onOpenChange={(open) => !open && setMode(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{mode === "new" ? `Add ${singular.toLowerCase()}` : `Edit ${singular.toLowerCase()}`}</DialogTitle>
          </DialogHeader>
          <div className="studio-dialog-body">
            {fields.map((f) => (
              <FieldControl key={f.name} def={f} value={draft[f.name]} onChange={(v) => setField(f.name, v)} mediaOptions={mediaOptions} />
            ))}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setMode(null)} disabled={saving}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this {singular.toLowerCase()}?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{deleteTarget ? str(deleteTarget[titleField]) : ""}&rdquo; will be permanently removed from the site. This can&rsquo;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-white hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function FieldControl({ def, value, onChange, mediaOptions }: { def: StudioFieldDef; value: unknown; onChange: (v: unknown) => void; mediaOptions: StudioMediaOption[] }) {
  if (def.type === "toggle") {
    return (
      <div className="studio-field-row">
        <label style={{ display: "flex", alignItems: "center", gap: "0.65rem", cursor: "pointer" }}>
          <Switch checked={value !== false} onCheckedChange={(v) => onChange(v)} />
          <span style={{ fontSize: "0.88rem", fontWeight: 600 }}>{def.label}</span>
        </label>
        {def.help && <span className="studio-hint">{def.help}</span>}
      </div>
    );
  }

  return (
    <div className="studio-field-row">
      <Label>{def.label}{def.required ? " *" : ""}</Label>
      {def.type === "textarea" && <Textarea rows={3} value={str(value)} placeholder={def.placeholder} onChange={(e) => onChange(e.target.value)} />}
      {(def.type === "text" || def.type === "url") && <Input value={str(value)} placeholder={def.placeholder} onChange={(e) => onChange(e.target.value)} />}
      {def.type === "date" && <Input type="datetime-local" value={toLocalInput(str(value))} onChange={(e) => onChange(fromLocalInput(e.target.value))} />}
      {def.type === "select" && (
        <select
          className="border-input flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          value={str(value)}
          onChange={(e) => onChange(e.target.value)}
        >
          {(def.options ?? []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      )}
      {def.type === "media" && def.mediaAssetType && <SiteImageField value={rel(value)} options={mediaOptions} onChange={(id) => onChange(id)} label={def.mediaLabel ?? "image"} assetType={def.mediaAssetType} />}
      {def.type === "media" && !def.mediaAssetType && <MediaPicker value={rel(value)} options={mediaOptions} onChange={(id) => onChange(id)} label={def.mediaLabel ?? "image"} />}
      {def.type === "string-list" && <StringList value={Array.isArray(value) ? (value as string[]) : []} itemLabel={def.itemLabel ?? "item"} onChange={onChange} />}
      {def.help && <span className="studio-hint">{def.help}</span>}
    </div>
  );
}

function StringList({ value, itemLabel, onChange }: { value: string[]; itemLabel: string; onChange: (v: string[]) => void }) {
  return (
    <div style={{ display: "grid", gap: "0.5rem" }}>
      {value.map((item, index) => (
        <div key={index} style={{ display: "flex", gap: "0.5rem" }}>
          <Input value={item} onChange={(e) => onChange(value.map((v, i) => (i === index ? e.target.value : v)))} />
          <Button type="button" variant="ghost" size="icon-sm" aria-label="Remove" onClick={() => onChange(value.filter((_, i) => i !== index))}><X /></Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => onChange([...value, ""])}><Plus /> Add {itemLabel}</Button>
    </div>
  );
}
