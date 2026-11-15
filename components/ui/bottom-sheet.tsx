"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

const DismissContext = createContext<() => void>(() => {});

/**
 * Quiet cancel button bound to the enclosing BottomSheet's dismiss handler.
 */
export function SheetCancel({ children = "Cancelar" }: { children?: React.ReactNode }) {
  const dismiss = useContext(DismissContext);
  return (
    <Button variant="quiet" type="button" onClick={dismiss}>
      {children}
    </Button>
  );
}

/**
 * Draggable mobile bottom sheet that adapts to a centered dialog on tablet/desktop.
 */
export function BottomSheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const closing = useRef(false);
  const drag = useRef({ y: 0, active: false });
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [entered, setEntered] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  function dismiss() {
    if (closing.current) return;
    closing.current = true;
    setDragging(false);
    setLeaving(true);
    window.setTimeout(() => onCloseRef.current(), 340);
  }

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setEntered(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const scrim = scrimRef.current;
    const viewport = window.visualViewport;
    if (!scrim || !viewport) return;

    const place = () => {
      scrim.style.top = `${viewport.offsetTop}px`;
      scrim.style.height = `${viewport.height}px`;
    };

    place();
    viewport.addEventListener("resize", place);
    viewport.addEventListener("scroll", place);
    return () => {
      viewport.removeEventListener("resize", place);
      viewport.removeEventListener("scroll", place);
    };
  }, []);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const previous = document.activeElement as HTMLElement | null;
    const focusable = () =>
      [...root.querySelectorAll<HTMLElement>("button, input, [href], textarea")].filter(
        (element) => !element.hasAttribute("disabled"),
      );

    const timer = window.setTimeout(() => {
      const field = root.querySelector<HTMLElement>("input, textarea");
      (field ?? focusable()[0])?.focus({ preventScroll: true });
    }, 380);

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        dismiss();
        return;
      }
      if (event.key !== "Tab") return;
      const nodes = focusable();
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, []);

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    drag.current = { y: event.clientY, active: true };
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!drag.current.active) return;
    setOffset(Math.max(0, event.clientY - drag.current.y));
  }

  function onPointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (!drag.current.active) return;
    drag.current.active = false;
    setDragging(false);
    const next = Math.max(0, event.clientY - drag.current.y);
    if (next > 72) dismiss();
    else setOffset(0);
  }

  const shift = leaving || !entered ? "100%" : `${offset}px`;

  return (
    <div
      ref={scrimRef}
      onClick={dismiss}
      className="fixed inset-x-0 top-0 z-30 flex h-(--app-height,100dvh) items-end justify-center bg-[rgba(10,37,64,0.45)] animate-[fade_0.24s_ease-out] md:items-center md:p-6"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
        ref={ref}
        style={{ transform: `translateY(${shift})` }}
        onClick={(event) => event.stopPropagation()}
        className={cn(
          "flex max-h-[min(92%,100%)] w-full flex-col gap-4 overflow-y-auto overscroll-contain rounded-t-[28px] bg-surface px-5 pt-2 pb-[calc(12px+env(safe-area-inset-bottom))] shadow-[0_-16px_48px_rgba(10,37,64,0.18)] will-change-transform md:w-[min(100%,460px)] md:rounded-2xl md:px-6 md:pt-5 md:pb-6 md:shadow-[var(--sh-2),0_20px_48px_rgba(10,37,64,0.2)]",
          dragging
            ? "transition-none"
            : "transition-transform duration-[420ms] ease-[cubic-bezier(0.32,0.72,0,1)]",
        )}
      >
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className="-mx-5 flex touch-none cursor-grab flex-col items-center gap-3 px-5 pt-1.5 active:cursor-grabbing md:cursor-default md:pt-0 md:active:cursor-default"
        >
          <span className="h-[5px] w-9 rounded-full bg-line-strong md:hidden" />
          <h2 id="sheet-title" className="m-0 self-stretch text-[20px] font-semibold tracking-[-0.03em] text-ink">
            {title}
          </h2>
        </div>
        <DismissContext.Provider value={dismiss}>{children}</DismissContext.Provider>
      </div>
    </div>
  );
}
