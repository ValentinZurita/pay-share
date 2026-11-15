"use client";

import { useEffect } from "react";

export function AppFrame() {
  useEffect(() => {
    const root = document.documentElement;
    const viewport = window.visualViewport;

    const apply = () => {
      const height = viewport?.height ?? window.innerHeight;
      root.style.setProperty("--app-height", `${Math.round(height)}px`);
    };

    apply();
    viewport?.addEventListener("resize", apply);
    window.addEventListener("orientationchange", apply);

    const onFocus = (event: FocusEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) return;
      window.setTimeout(() => target.scrollIntoView({ block: "center" }), 300);
    };
    document.addEventListener("focusin", onFocus);

    return () => {
      viewport?.removeEventListener("resize", apply);
      window.removeEventListener("orientationchange", apply);
      document.removeEventListener("focusin", onFocus);
    };
  }, []);

  return null;
}
