"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

export function LivePreviewRefresh() {
  const router = useRouter();
  const sentReady = useRef(false);

  useEffect(() => {
    const destination = window.opener || (window.parent !== window ? window.parent : null);
    if (!destination) return;

    const origin = window.location.origin;
    const onMessage = (event: MessageEvent) => {
      if (
        event.origin === origin &&
        event.data &&
        typeof event.data === "object" &&
        event.data.type === "payload-document-event"
      ) {
        router.refresh();
      }
    };

    window.addEventListener("message", onMessage);
    if (!sentReady.current) {
      sentReady.current = true;
      destination.postMessage({ type: "payload-live-preview", ready: true }, origin);
    }
    return () => window.removeEventListener("message", onMessage);
  }, [router]);

  return null;
}