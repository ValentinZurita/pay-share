import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type BannerVariant = "warn" | "error" | "info";

const BANNER_VARIANTS: Record<BannerVariant, string> = {
  warn: "bg-warn-bg text-warn",
  error: "bg-warn-bg text-danger",
  info: "bg-accent-tint text-accent",
};

/**
 * Inline alert banner for connection warnings or form-level notices.
 */
export function Banner({
  variant = "warn",
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement> & { variant?: BannerVariant }) {
  return (
    <p
      role="alert"
      className={cn(
        "m-0 rounded-2xl px-3.5 py-2.5 text-[14px] font-medium",
        BANNER_VARIANTS[variant],
        className,
      )}
      {...props}
    />
  );
}
