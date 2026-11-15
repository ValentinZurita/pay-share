import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type EmptyStateTone = "icon" | "success";

/**
 * Centered state block for empty tables, errors, instructions, or success screens.
 */
export function EmptyState({
  icon,
  tone = "icon",
  title,
  description,
  grow = true,
  children,
  className,
}: {
  icon?: ReactNode;
  tone?: EmptyStateTone;
  title: ReactNode;
  description?: ReactNode;
  grow?: boolean;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 text-center",
        grow && "my-auto",
        className,
      )}
    >
      {icon ? (
        tone === "success" ? (
          <div className="grid h-16 w-16 place-items-center rounded-full bg-ok-solid text-on-primary animate-[pop_0.45s_var(--ease)]">
            {icon}
          </div>
        ) : (
          <div className="glass grid h-[84px] w-[84px] place-items-center rounded-full text-accent">
            {icon}
          </div>
        )
      ) : null}
      <p className="m-0 text-[26px] font-bold leading-[1.2] tracking-[-0.025em] text-fg text-balance">
        {title}
      </p>
      {description ? <p className="m-0 max-w-[30ch] text-[15.5px] text-fg2">{description}</p> : null}
      {children}
    </div>
  );
}
