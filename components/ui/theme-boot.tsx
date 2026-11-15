"use client";

import { useRef } from "react";
import { useServerInsertedHTML } from "next/navigation";
import { themeBootScript } from "@/lib/theme";

/** Lo inserta Next en <head> una sola vez. No es un <script> del árbol de React. */
export function ThemeBoot() {
  const inserted = useRef(false);
  useServerInsertedHTML(() => {
    if (inserted.current) return null;
    inserted.current = true;
    return <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />;
  });
  return null;
}
