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
        "glass inline-flex max-w-full flex-wrap items-center justify-center gap-2 rounded-full px-3.5 py-2 text-center text-[14px] font-medium text-fg",
        className,
      )}
    >
      {loading ? (
        <span
          aria-hidden="true"
          className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-line-strong border-t-fg"
        />
      ) : null}
      {children}
    </span>
  );
}
