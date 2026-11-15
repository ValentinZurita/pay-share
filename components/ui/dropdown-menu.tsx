"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface DropdownMenuItem {
  label: string;
  onSelect: () => void;
}

/**
 * Accessible dropdown menu with automatic click-outside and Escape dismissal.
 */
export function DropdownMenu({
  label,
  trigger,
  items,
  className,
  menuClassName,
}: {
  label: string;
  trigger: (props: { open: boolean; toggle: () => void }) => ReactNode;
  items: DropdownMenuItem[];
  className?: string;
  menuClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (event.target instanceof Node && rootRef.current?.contains(event.target)) return;
      setOpen(false);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={cn("relative shrink-0", className)} aria-label={label}>
      {trigger({ open, toggle: () => setOpen((prev) => !prev) })}
      {open ? (
        <div
          role="menu"
          className={cn(
            "absolute right-0 top-[calc(100%+6px)] z-10 flex min-w-[180px] flex-col rounded-xl bg-surface p-1.5 shadow-[var(--sh-1),0_8px_24px_rgba(10,37,64,0.14)]",
            menuClassName,
          )}
        >
          {items.map((item) => (
            <button
              key={item.label}
              role="menuitem"
              type="button"
              onClick={() => {
                setOpen(false);
                item.onSelect();
              }}
              className="min-h-11 rounded-lg bg-transparent px-3 text-left text-[15px] font-medium text-ink transition-colors hover:bg-primary-tint focus-visible:bg-primary-tint"
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
