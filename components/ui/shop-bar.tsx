import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);
  const letters = parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
  return letters || "PS";
}

/**
 * Top header bar displaying restaurant initials, title/subtitle, or custom leading/trailing slots.
 */
export function ShopBar({
  restaurant,
  subtitle,
  leading,
  end,
  className,
}: {
  restaurant: string;
  subtitle?: ReactNode;
  leading?: ReactNode;
  end?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "flex min-h-[60px] flex-none items-center gap-2.5 px-5 pt-[calc(16px+env(safe-area-inset-top))] pb-2.5 max-[380px]:px-4",
        className,
      )}
    >
      {leading ?? (
        <span
          className="grid h-7 w-7 flex-none place-items-center rounded-full bg-ink text-[11px] font-semibold text-surface"
          aria-hidden="true"
        >
          {initials(restaurant)}
        </span>
      )}
      <span className="text-[15px] font-semibold leading-[1.25] tracking-[-0.01em] text-ink num">
        {restaurant}
        {subtitle ? (
          <small className="block text-[12.5px] font-normal tracking-normal text-muted">
            {subtitle}
          </small>
        ) : null}
      </span>
      {end ? <span className="ml-auto">{end}</span> : null}
    </header>
  );
}
