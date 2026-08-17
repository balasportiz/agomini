"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

const RECONNECT_BASE_MS = 2_000;
const RECONNECT_MAX_MS = 30_000;

/**
 * Connects to /api/events (Server-Sent Events) and refreshes the current
 * route whenever admin content changes, so visitors already on the site see
 * updates without needing to reload the page. Reconnects with backoff if the
 * connection drops (e.g. a deploy or a brief network blip).
 *
 * This is separate from <LivePreviewRefresh>, which only serves Payload's
 * own live-preview iframe/popout inside the admin panel.
 */
export function LiveUpdates() {
  const router = useRouter();
  const attemptRef = useRef(0);

  useEffect(() => {
    let source: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;

    const connect = () => {
      if (cancelled) return;
      source = new EventSource("/api/events");

      source.addEventListener("open", () => {
        attemptRef.current = 0;
      });

      source.addEventListener("content-changed", () => {
        router.refresh();
      });

      source.addEventListener("error", () => {
        source?.close();
        if (cancelled) return;
        const attempt = attemptRef.current + 1;
        attemptRef.current = attempt;
        const delay = Math.min(RECONNECT_MAX_MS, RECONNECT_BASE_MS * 2 ** (attempt - 1));
        reconnectTimer = setTimeout(connect, delay);
      });
    };

    connect();

    return () => {
      cancelled = true;
      source?.close();
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };
  }, [router]);

  return null;
}
