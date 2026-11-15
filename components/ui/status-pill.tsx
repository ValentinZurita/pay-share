import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Pill indicator with an optional loading spinner for live payment status.
 */
export function StatusPill({
  loading = false,
  children,
  className,
}: {
  loading?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      role="status"
      className={cn(
        "inline-flex max-w-full flex-wrap items-center justify-center gap-2 rounded-full bg-surface px-3.5 py-1.5 text-center text-[13.5px] font-medium text-ink shadow-card",
        className,
      )}
    >
      {loading ? (
        <span
          aria-hidden="true"
          className="h-[13px] w-[13px] shrink-0 animate-spin rounded-full border-2 border-line-strong border-t-primary"
        />
      ) : null}
      {children}
    </span>
  );
}
