"use client";

import { useEffect, useState } from "react";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { IconTheme } from "@/components/ui/icons";
import { parseTheme, themeClass, THEME_STORAGE_KEY, THEMES, type Theme } from "@/lib/theme";

const OPTIONS: { id: Theme; label: string }[] = [
  { id: "light", label: "Claro" },
  { id: "auto", label: "Auto" },
  { id: "dark", label: "Oscuro" },
];

function appliedTheme(): Theme {
  const { classList } = document.documentElement;
  if (classList.contains(themeClass("dark"))) return "dark";
  if (classList.contains(themeClass("auto"))) return "auto";
  return "light";
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  for (const option of THEMES) root.classList.remove(themeClass(option));
  root.classList.add(themeClass(theme));
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* localStorage bloqueado: la clase de esta visita se queda */
  }
}

/**
 * Botón de icono que abre el menú de tema y marca el modo activo.
 */
export function ThemeMenu() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(THEME_STORAGE_KEY);
    } catch {
      stored = null;
    }
    applyTheme(parseTheme(stored));
  }, []);

  return (
    <DropdownMenu
      label="Tema"
      items={OPTIONS.map((option) => ({
        label: option.label,
        selected: option.id === theme,
        onSelect: () => {
          applyTheme(option.id);
          setTheme(option.id);
        },
      }))}
      trigger={({ open, toggle }) => (
        <button
          type="button"
          className="ps-round"
          aria-label="Tema"
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => {
            setTheme(appliedTheme());
            toggle();
          }}
        >
          <IconTheme />
        </button>
      )}
    />
  );
}
