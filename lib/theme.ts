export const THEME_STORAGE_KEY = "ps-theme";

export const THEMES = ["light", "auto", "dark"] as const;

export type Theme = (typeof THEMES)[number];

export function parseTheme(value: unknown): Theme {
  return typeof value === "string" && (THEMES as readonly string[]).includes(value)
    ? (value as Theme)
    : "light";
}

export function themeClass(theme: Theme): `t-${Theme}` {
  return `t-${theme}`;
}

const themeGuard = THEMES.map((theme) => `s===${JSON.stringify(theme)}`).join("||");
const themeClasses = THEMES.map((theme) => JSON.stringify(themeClass(theme))).join(",");

/** Script bloqueante del layout: aplica la clase antes de pintar y no truena si localStorage falla. */
export const themeBootScript = `(function(){try{var s=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});var t=(${themeGuard})?s:"light";var r=document.documentElement;r.classList.remove(${themeClasses});r.classList.add("t-"+t);}catch(e){try{document.documentElement.classList.add("t-light");}catch(e2){}}})();`;
