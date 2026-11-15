"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { IconCheck } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

export interface DropdownMenuItem {
  label: string;
  onSelect: () => void;
  /** Cuando está definido, la opción es un menuitemradio. */
  selected?: boolean;
}

type MenuBox = { top: number; right: number };

/**
 * Accessible dropdown. The panel is portaled so glass surfaces below cannot cover it.
 */
export function DropdownMenu({
  label,
  trigger,
  items,
  positioned = true,
  className,
  menuClassName,
}: {
  label: string;
  trigger: (props: { open: boolean; toggle: () => void }) => ReactNode;
  items: DropdownMenuItem[];
  positioned?: boolean;
  className?: string;
  menuClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [box, setBox] = useState<MenuBox | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const selectable = items.some((item) => item.selected !== undefined);

  function toggle() {
    setBox(null);
    setOpen((prev) => !prev);
  }

  useEffect(() => {
    if (!open) return;

    function place() {
      const rect = rootRef.current?.getBoundingClientRect();
      if (!rect) return;
      setBox({ top: rect.bottom + 6, right: Math.max(8, window.innerWidth - rect.right) });
    }

    function onPointerDown(event: PointerEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    const frame = window.requestAnimationFrame(place);
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  const menu =
    open && box
      ? createPortal(
          <div
            ref={menuRef}
            role="menu"
            aria-label={label}
            style={{ top: box.top, right: box.right }}
            className={cn(
              "ps-menu flex min-w-[180px] flex-col rounded-2xl p-1.5",
              menuClassName,
            )}
          >
            {items.map((item) => (
              <button
                key={item.label}
                role={selectable ? "menuitemradio" : "menuitem"}
                type="button"
                aria-checked={selectable ? item.selected === true : undefined}
                onClick={() => {
                  setOpen(false);
                  item.onSelect();
                }}
                className={cn(
                  "flex min-h-11 items-center justify-between gap-3 rounded-xl px-3 text-left text-[15px] font-medium text-fg",
                  item.selected ? "bg-accent-tint text-accent" : "bg-transparent hover:bg-fill",
                )}
              >
                <span>{item.label}</span>
                {item.selected ? <IconCheck className="shrink-0" /> : null}
              </button>
            ))}
          </div>,
          document.body,
        )
      : null;

  return (
    <div ref={rootRef} className={cn(positioned && "relative", "shrink-0", className)} aria-label={label}>
      {trigger({ open, toggle })}
      {menu}
    </div>
  );
}
