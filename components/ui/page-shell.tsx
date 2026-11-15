import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Mobile-first 440px column shell sized to `--app-height` (or `100dvh`).
 */
export function DinerShell({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "mx-auto flex h-(--app-height,100dvh) w-full max-w-[440px] flex-col overflow-hidden bg-bg",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Scrollable main body inside a flex column shell.
 */
export function ScrollBody({
  padding = "default",
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement> & { padding?: "default" | "none" }) {
  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto",
        padding === "default" && "px-5 pt-1.5 pb-5 max-[380px]:px-4",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Sticky bottom action bar with safe-area bottom inset.
 */
export function FooterBar({
  tone = "surface",
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement> & { tone?: "surface" | "integrated" }) {
  return (
    <div
      className={cn(
        "flex flex-none flex-col gap-2.5 px-5 pt-3.5 pb-[calc(16px+env(safe-area-inset-bottom))] max-[380px]:px-4",
        tone === "integrated"
          ? "bg-surface shadow-[0_-1px_0_var(--line)] min-[480px]:border-t min-[480px]:border-line/80 min-[480px]:bg-bg/90 min-[480px]:shadow-none min-[480px]:backdrop-blur-md"
          : "bg-surface shadow-[0_-1px_0_var(--line)]",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Centered single-card page layout (used for login and configuration errors).
 */
export function CenteredCardShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid min-h-(--app-height,100dvh) place-items-center px-5 py-6",
        className,
      )}
    >
      <div className="w-full max-w-[380px]">{children}</div>
    </div>
  );
}
