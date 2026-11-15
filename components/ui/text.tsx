import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

/**
 * Top-level page heading used in cashier and QR print views.
 */
export function PageTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h1
      className={cn("m-0 text-[24px] font-bold tracking-[-0.03em] text-ink", className)}
      {...props}
    />
  );
}

/**
 * Small uppercase/muted section label (e.g. restaurant name or card header).
 */
export function LabelText({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("m-0 text-[13px] font-medium text-muted", className)} {...props} />
  );
}

/**
 * Muted inline status or empty-state note.
 */
export function MutedNote({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("m-0 px-0.5 py-1 text-[13.5px] text-muted", className)} {...props} />
  );
}

/**
 * Accessible inline validation or action error message.
 */
export function ErrorText({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      role="alert"
      className={cn("m-0 text-[13px] font-medium text-danger", className)}
      {...props}
    />
  );
}
