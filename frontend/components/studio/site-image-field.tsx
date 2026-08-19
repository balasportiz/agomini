"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ImageIcon, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { uploadMedia } from "@/components/studio/studio-api";
import type { StudioMediaOption } from "@/lib/studio-data";

function siteImageUrl(id: string): string {
  return `/api/photos/${encodeURIComponent(id)}/source`;
}

/**
 * Upload control for non-gallery imagery (website images, partner logos).
 * Unlike the gallery MediaPicker, files upload straight from here and publish
 * immediately — they never appear in the event gallery.
 */
export function SiteImageField({
  value,
  options,
  onChange,
  label = "image",
  assetType = "site",
}: {
  value: string | null;
  options: StudioMediaOption[];
  onChange: (id: string | null) => void;
  label?: string;
  assetType?: "site" | "partner";
}) {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState<StudioMediaOption[]>([]);
  const fileInput = useRef<HTMLInputElement>(null);

  const all = [...uploaded, ...options];
  const selected = all.find((o) => o.id === value) || null;
  // Fall back to the raw id so a photo uploaded before this change (or one
  // still living in the gallery) still previews instead of looking lost.
  const previewUrl = selected?.url ?? (value ? siteImageUrl(value) : null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    try {
      const result = await uploadMedia(file, {
        altText: "",
        active: true,
        featured: false,
        assetType,
        showInGallery: false,
      });
      setUploaded((current) => [
        { id: result.id, url: siteImageUrl(result.id), altText: "", filename: result.filename, active: true },
        ...current,
      ]);
      onChange(result.id);
      toast.success("Photo uploaded. Publish this page to put it on the live site.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  return (
    <div className="studio-media-picker">
      <div className="studio-media-picker__preview">
        {previewUrl ? (
          <Image src={previewUrl} alt={selected?.altText || ""} width={120} height={80} className="studio-media-picker__thumb" unoptimized />
        ) : (
          <div className="studio-media-picker__empty" aria-hidden="true">
            <ImageIcon />
          </div>
        )}
        <div className="studio-media-picker__actions">
          <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => fileInput.current?.click()}>
            <Upload /> {uploading ? "Uploading…" : selected || value ? `Replace ${label}` : `Upload ${label}`}
          </Button>
          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            hidden
            onChange={(e) => void handleFile(e.target.files?.[0])}
          />
          {all.length > 0 && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button type="button" variant="ghost" size="sm">
                  Previous uploads
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>Previously uploaded {assetType === "partner" ? "logos" : "website images"}</DialogTitle>
                </DialogHeader>
                <div className="studio-dialog-body">
                  <div className="studio-media-picker__grid">
                    {all.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        className="studio-media-picker__option"
                        data-selected={option.id === value}
                        onClick={() => {
                          onChange(option.id);
                          setOpen(false);
                        }}
                      >
                        <Image src={option.url} alt={option.altText || option.filename} width={160} height={110} unoptimized />
                      </button>
                    ))}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
          {value && (
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)}>
              <X /> Remove
            </Button>
          )}
        </div>
      </div>
      <p className="studio-hint">
        {assetType === "partner"
          ? "Logos are independent: they never appear in the event gallery, and they show on the website as soon as the partner is saved."
          : "Website images are independent: they never appear in the event gallery, and they go live as soon as you publish this page."}
      </p>
    </div>
  );
}
