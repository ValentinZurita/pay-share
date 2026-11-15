import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type BadgeVariant = "ok" | "neutral" | "info" | "warn";

const BADGE_VARIANTS: Record<BadgeVariant, string> = {
  ok: "bg-ok-bg text-ok",
  neutral: "bg-fill text-fg2",
  info: "bg-accent-tint text-accent",
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
        "inline-block rounded-full px-2 py-0.5 text-[11.5px] font-semibold leading-[18px] whitespace-nowrap",
        BADGE_VARIANTS[variant],
        className,
      )}
      {...props}
    />
  );
}
