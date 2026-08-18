"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function StoryMotion({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const motionPreference = matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;

    const update = () => {
      frame = 0;
      if (motionPreference.matches) {
        element.style.setProperty("--story-progress", "0");
        return;
      }
      const rect = element.getBoundingClientRect();
      const range = Math.max(1, rect.height - innerHeight);
      const progress = Math.max(0, Math.min(1, -rect.top / range));
      element.style.setProperty("--story-progress", progress.toFixed(4));
    };
    const requestUpdate = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    addEventListener("scroll", requestUpdate, { passive: true });
    addEventListener("resize", requestUpdate);
    motionPreference.addEventListener("change", requestUpdate);
    return () => {
      removeEventListener("scroll", requestUpdate);
      removeEventListener("resize", requestUpdate);
      motionPreference.removeEventListener("change", requestUpdate);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return <section ref={ref} className="story-chapter">{children}</section>;
}
