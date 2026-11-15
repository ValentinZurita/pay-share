import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type BadgeVariant = "ok" | "neutral" | "info" | "warn";

const BADGE_VARIANTS: Record<BadgeVariant, string> = {
  ok: "bg-ok-bg text-ok",
  neutral: "bg-neutral-bg text-neutral",
  info: "bg-primary-tint text-primary-press",
  warn: "bg-warn-bg text-warn",
};

/**
 * Compact status pill for table states and payment statuses.
 */
export function Badge({
  variant = "neutral",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span
      className={cn(
        "inline-block rounded px-1.5 text-[12px] font-medium leading-[18px] whitespace-nowrap",
        BADGE_VARIANTS[variant],
        className,
      )}
      {...props}
    />
  );
}
