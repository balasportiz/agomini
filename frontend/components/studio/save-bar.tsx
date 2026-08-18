"use client";

import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SaveBar({
  dirty,
  saving,
  onSave,
  savedLabel = "All changes saved",
  dirtyLabel = "You have unsaved changes",
}: {
  dirty: boolean;
  saving: boolean;
  onSave: () => void;
  savedLabel?: string;
  dirtyLabel?: string;
}) {
  return (
    <div className="studio-savebar">
      <span className="studio-savebar__status" data-dirty={dirty}>
        {dirty ? dirtyLabel : (
          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
            <Check size={15} /> {savedLabel}
          </span>
        )}
      </span>
      <Button type="button" onClick={onSave} disabled={!dirty || saving}>
        {saving ? "Saving…" : "Save changes"}
      </Button>
    </div>
  );
}
