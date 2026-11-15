import type { ReactNode } from "react";
import { IconLogo } from "@/components/ui/icons";
import { ThemeMenu } from "@/components/ui/theme-menu";
import { cn } from "@/lib/cn";

export function cajaSubtitle(restaurant: string | null | undefined): string {
  const name = typeof restaurant === "string" ? restaurant.trim() : "";
  return name ? `Caja · ${name}` : "Caja";
}

/**
 * Barra de marca: logo, PayShare, subtítulo y ranura derecha (chip y tema).
 */
export function BrandBar({
  title = "PayShare",
  subtitle,
  chip,
  leading,
  end,
  showTheme = true,
  className,
}: {
  title?: string;
  subtitle?: ReactNode;
  chip?: ReactNode;
  leading?: ReactNode;
  end?: ReactNode;
  showTheme?: boolean;
  className?: string;
}) {
  return (
    <header className={cn("ps-nav glass", className)}>
      {leading ?? (
        <span className="ps-logo" aria-hidden="true">
          <IconLogo />
        </span>
      )}
      <span className="ps-nav-title">
        <b>{title}</b>
        {subtitle ? <small>{subtitle}</small> : null}
      </span>
      <span className="ps-nav-end">
        {chip ? <span className="ps-chip">{chip}</span> : null}
        {end}
        {showTheme ? <ThemeMenu /> : null}
      </span>
    </header>
  );
}
