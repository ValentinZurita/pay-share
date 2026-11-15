"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";

const DismissContext = createContext<() => void>(() => {});

export function SheetCancel({ children = "Cancelar" }: { children?: React.ReactNode }) {
  const dismiss = useContext(DismissContext);
  return (
    <button className="btn quiet" type="button" onClick={dismiss}>
      {children}
    </button>
  );
}

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
  onCloseRef.current = onClose;

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
    <div className="scrim" ref={scrimRef} onClick={dismiss}>
      <div
        className={dragging ? "sheet dragging" : "sheet"}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
        ref={ref}
        style={{ transform: `translateY(${shift})` }}
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className="sheet-grab"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <span className="sheet-handle" />
          <h2 id="sheet-title">{title}</h2>
        </div>
        <DismissContext.Provider value={dismiss}>{children}</DismissContext.Provider>
      </div>
    </div>
  );
}
