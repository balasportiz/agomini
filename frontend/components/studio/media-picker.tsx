"use client";

import Image from "next/image";
import { useState } from "react";
import { ImageIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { StudioMediaOption } from "@/lib/studio-data";

export function MediaPicker({
  value,
  options,
  onChange,
  label = "photo",
}: {
  value: string | null;
  options: StudioMediaOption[];
  onChange: (id: string | null) => void;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.id === value) || null;

  return (
    <div className="studio-media-picker">
      <div className="studio-media-picker__preview">
        {selected ? (
          <Image src={selected.url} alt={selected.altText || ""} width={120} height={80} className="studio-media-picker__thumb" unoptimized />
        ) : (
          <div className="studio-media-picker__empty" aria-hidden="true">
            <ImageIcon />
          </div>
        )}
        <div className="studio-media-picker__actions">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button type="button" variant="outline" size="sm">
                {selected ? `Change ${label}` : `Choose ${label}`}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Choose a {label}</DialogTitle>
              </DialogHeader>
              <div className="studio-dialog-body">
                {options.length === 0 ? (
                  <p className="studio-hint">No photos yet. Upload some in the Photo gallery first.</p>
                ) : (
                  <div className="studio-media-picker__grid">
                    {options.map((option) => (
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
                        {!option.active && <span className="studio-media-picker__badge">Hidden</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
          {selected && (
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)}>
              <X /> Remove
            </Button>
          )}
        </div>
      </div>
      {selected && !selected.active && (
        <p className="studio-hint" style={{ color: "oklch(0.5 0.2 25)", fontWeight: 600 }}>
          This photo is hidden. Visitors will not see it until you switch it Live in the Photo gallery.
        </p>
      )}
      {selected && !selected.altText && (
        <p className="studio-hint" style={{ color: "oklch(0.55 0.15 60)" }}>
          This photo has no alt text. Add it in the Photo gallery so screen-reader users understand it.
        </p>
      )}
    </div>
  );
}
