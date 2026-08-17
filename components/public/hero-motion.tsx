"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function HeroMotion({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const intro = element.querySelector<HTMLElement>(".hero-copy");
    let frame = 0;
    let listening = false;
    let showingManifesto = false;

    const setPhase = (manifesto: boolean) => {
      if (manifesto === showingManifesto) return;
      showingManifesto = manifesto;
      element.dataset.heroPhase = manifesto ? "manifesto" : "intro";
      if (intro) intro.inert = manifesto;
    };
    const update = () => {
      frame = 0;
      const rect = element.getBoundingClientRect();
      const range = Math.max(1, rect.height - window.innerHeight);
      const progress = Math.max(0, Math.min(1, -rect.top / range));
      element.style.setProperty("--hero-progress", progress.toFixed(4));
      setPhase(progress >= 0.5);
    };
    const requestUpdate = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const stop = () => {
      if (!listening) return;
      removeEventListener("scroll", requestUpdate);
      removeEventListener("resize", requestUpdate);
      listening = false;
    };
    const start = () => {
      if (motionPreference.matches) {
        element.style.setProperty("--hero-progress", "0");
        setPhase(false);
        return;
      }
      if (!listening) {
        addEventListener("scroll", requestUpdate, { passive: true });
        addEventListener("resize", requestUpdate);
        listening = true;
      }
      requestUpdate();
    };
    const onPreferenceChange = () => {
      stop();
      start();
    };

    start();
    motionPreference.addEventListener("change", onPreferenceChange);
    return () => {
      stop();
      motionPreference.removeEventListener("change", onPreferenceChange);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return <section ref={ref} id="home" className="hero-scroll">{children}</section>;
}
