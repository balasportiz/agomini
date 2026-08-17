"use client";

import { useRef, useState } from "react";
import { Eye, ExternalLink, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const PREVIEW_TARGETS = [
  { label: "Home", path: "/" },
  { label: "Gallery", path: "/gallery" },
  { label: "Register", path: "/register" },
  { label: "Results", path: "/results" },
];

/**
 * Live preview of the public site inside a slide-over. The public pages run the
 * SSE LiveUpdates client, so saving an edit in the Studio refreshes this
 * preview automatically — no manual reload.
 */
export function PreviewDrawer({ initialPath = "/" }: { initialPath?: string }) {
  const [open, setOpen] = useState(false);
  const [path, setPath] = useState(initialPath);
  const frameRef = useRef<HTMLIFrameElement>(null);

  function reload() {
    if (frameRef.current) frameRef.current.src = path;
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <Eye /> <span>Preview</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-[min(560px,92vw)] p-0 gap-0">
        <SheetHeader className="border-b">
          <SheetTitle>Live preview</SheetTitle>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
            {PREVIEW_TARGETS.map((t) => (
              <Button key={t.path} variant={path === t.path ? "default" : "outline"} size="sm" onClick={() => setPath(t.path)}>
                {t.label}
              </Button>
            ))}
            <Button variant="ghost" size="icon-sm" aria-label="Reload preview" onClick={reload}><RefreshCw /></Button>
            <Button variant="ghost" size="icon-sm" aria-label="Open in new tab" asChild>
              <a href={path} target="_blank" rel="noreferrer"><ExternalLink /></a>
            </Button>
          </div>
          <p className="text-muted-foreground" style={{ fontSize: "0.78rem", margin: 0 }}>
            Updates automatically when you save changes.
          </p>
        </SheetHeader>
        <iframe
          ref={frameRef}
          key={path}
          src={path}
          title="Website preview"
          style={{ flex: 1, width: "100%", border: 0, background: "var(--white)" }}
        />
      </SheetContent>
    </Sheet>
  );
}
