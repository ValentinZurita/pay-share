"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AccountCard } from "@/components/ui/account-card";
import { BottomSheet, SheetCancel } from "@/components/ui/bottom-sheet";
import { IconBack, IconMore } from "@/components/ui/icons";
import { QrImage } from "@/components/ui/qr-image";
import { formatMXN, parsePesosToCents, sanitizePesosInput } from "@/lib/money";
import type { Snapshot } from "@/lib/types";
import { useLiveSnapshot } from "@/lib/use-live-snapshot";

export function CajaApp({ initial }: { initial: Snapshot[] }) {
  const live = useLiveSnapshot(null, initial);
  const tables = (Array.isArray(live.data) ? live.data : initial) as Snapshot[];
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [mobileDetail, setMobileDetail] = useState(false);
  const [wide, setWide] = useState(false);
  const [sheet, setSheet] = useState<null | "open" | "close" | "share" | "remove">(null);
  const [total, setTotal] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);
  const [menu, setMenu] = useState(false);
  const [cardMenuId, setCardMenuId] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const cardMenuRef = useRef<HTMLDivElement>(null);
  const seen = useRef<Set<number>>(new Set());
  const ready = useRef(false);
  const [fresh, setFresh] = useState<Set<number>>(new Set());

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 900px)");
    const apply = () => setWide(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  const selected = tables.find((table) => table.table.id === selectedId) ?? null;

  useEffect(() => {
    const ids = tables.flatMap(
      (table) => table.bill?.payments.filter((payment) => payment.status === "paid").map((payment) => payment.id) ?? [],
    );
    if (!ready.current) {
      ids.forEach((id) => seen.current.add(id));
      ready.current = true;
      return;
    }
    const arrived = ids.filter((id) => !seen.current.has(id));
    ids.forEach((id) => seen.current.add(id));
    if (arrived.length === 0) return;
    setFresh(new Set(arrived));
    const timer = window.setTimeout(() => setFresh(new Set()), 2000);
    return () => window.clearTimeout(timer);
  }, [tables]);

  function openTable(id: number) {
    const table = tables.find((item) => item.table.id === id);
    setSelectedId(id);
    setError("");
    setTotal("");
    setCopied(false);
    setMenu(false);
    if (!table?.bill) {
      setSheet("open");
      setMobileDetail(false);
      return;
    }
    setSheet(null);
    if (!wide) setMobileDetail(true);
  }

  async function submitOpen(event?: React.FormEvent) {
    event?.preventDefault();
    if (!selectedId || sending) return;
    let cents = 0;
    try {
      cents = parsePesosToCents(total);
    } catch {
      setError("Escribe el total, por ejemplo 500.");
      return;
    }
    if (cents <= 0) {
      setError("Escribe el total, por ejemplo 500.");
      return;
    }
    setSending(true);
    setError("");
    try {
      const response = await fetch("/api/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tableId: selectedId, totalCents: cents }),
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(body.error ?? "No pudimos abrir la cuenta.");
        return;
      }
      setSheet(null);
      if (!wide) setMobileDetail(true);
      await live.reload();
    } catch {
      setError("No pudimos conectar. Revisa tu internet e inténtalo de nuevo.");
    } finally {
      setSending(false);
    }
  }

  async function submitClose() {
    if (!selected?.bill || sending) return;
    setSending(true);
    try {
      const response = await fetch(`/api/bills/${selected.bill.id}/close`, { method: "POST" });
      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        setError(body.error ?? "No pudimos cerrar la mesa.");
        return;
      }
      setSheet(null);
      setMobileDetail(false);
      await live.reload();
    } catch {
      setError("No pudimos conectar. Revisa tu internet e inténtalo de nuevo.");
    } finally {
      setSending(false);
    }
  }

  useEffect(() => {
    if (!menu && cardMenuId == null) return;
    function onPointer(event: PointerEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (menuRef.current?.contains(target) || cardMenuRef.current?.contains(target)) return;
      setMenu(false);
      setCardMenuId(null);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setMenu(false);
      setCardMenuId(null);
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [menu, cardMenuId]);

  const mesaUrl = selected && origin ? `${origin}/mesa/${selected.table.id}` : "";

  async function shareLink() {
    if (!selected || !mesaUrl) return;
    const payload = {
      title: selected.table.name,
      text: `Paga tu parte en ${selected.table.name}`,
      url: mesaUrl,
    };
    try {
      if (navigator.share) {
        await navigator.share(payload);
        return;
      }
      await navigator.clipboard.writeText(mesaUrl);
      setCopied(true);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      try {
        await navigator.clipboard.writeText(mesaUrl);
        setCopied(true);
      } catch {
        setError("No pudimos compartir el enlace.");
      }
    }
  }

  const mesaMenu = (
    <div className="more" ref={menuRef}>
      <button
        className="backb"
        type="button"
        aria-label="Opciones de la mesa"
        aria-expanded={menu}
        aria-haspopup="menu"
        onClick={() => setMenu((open) => !open)}
      >
        <IconMore />
      </button>
      {menu ? (
        <div className="more-menu" role="menu">
          <button
            role="menuitem"
            type="button"
            onClick={() => {
              setMenu(false);
              setSheet("share");
            }}
          >
            Ver código
          </button>
          <button
            role="menuitem"
            type="button"
            onClick={() => {
              setMenu(false);
              void shareLink();
            }}
          >
            Enviar enlace
          </button>
        </div>
      ) : null}
    </div>
  );

  const showDetail = Boolean(selected?.bill) && (wide || mobileDetail);

  async function addTable() {
    if (sending) return;
    setSending(true);
    setError("");
    try {
      const response = await fetch("/api/tables", { method: "POST" });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(body.error ?? "No pudimos agregar la mesa.");
        return;
      }
      await live.reload();
    } catch {
      setError("No pudimos conectar. Revisa tu internet e inténtalo de nuevo.");
    } finally {
      setSending(false);
    }
  }

  function editAmount(table: Snapshot) {
    setCardMenuId(null);
    setSelectedId(table.table.id);
    setError("");
    setMobileDetail(false);
    if (!table.bill) {
      setTotal("");
      setSheet("open");
      return;
    }
    setTotal((table.bill.totalCents / 100).toFixed(2));
    setSheet("edit");
  }

  function askRemove(table: Snapshot) {
    setCardMenuId(null);
    setSelectedId(table.table.id);
    setError("");
    setSheet("remove");
  }

  async function submitEdit(event?: React.FormEvent) {
    event?.preventDefault();
    if (!selected?.bill || sending) return;
    let cents = 0;
    try {
      cents = parsePesosToCents(total);
    } catch {
      setError("Escribe el total, por ejemplo 500.");
      return;
    }
    if (cents <= 0) {
      setError("Escribe el total, por ejemplo 500.");
      return;
    }
    setSending(true);
    setError("");
    try {
      const response = await fetch(`/api/bills/${selected.bill.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ totalCents: cents }),
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(body.error ?? "No pudimos guardar el monto.");
        return;
      }
      setSheet(null);
      await live.reload();
    } catch {
      setError("No pudimos conectar. Revisa tu internet e inténtalo de nuevo.");
    } finally {
      setSending(false);
    }
  }

  async function submitDelete() {
    if (!selected || sending) return;
    setSending(true);
    setError("");
    try {
      const response = await fetch(`/api/tables/${selected.table.id}`, { method: "DELETE" });
      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        setError(body.error ?? "No pudimos quitar la mesa.");
        return;
      }
      setSheet(null);
      setSelectedId(null);
      setMobileDetail(false);
      await live.reload();
    } catch {
      setError("No pudimos conectar. Revisa tu internet e inténtalo de nuevo.");
    } finally {
      setSending(false);
    }
  }

  const list = (
    <div className="body">
      <div className="list-head">
        <h1 className="h-page">Mesas</h1>
        <button className="btn secondary compact" type="button" disabled={sending} onClick={() => void addTable()}>
          Nueva mesa
        </button>
      </div>
      {error && !showDetail ? (
        <p className="banner" role="alert">
          {error}
        </p>
      ) : null}
      {live.error ? (
        <p className="banner" role="alert">
          {live.error}
        </p>
      ) : null}
      {tables.length === 0 ? <p className="empty-note">No hay mesas. Agrega la primera.</p> : null}
      <div className="grid">
        {tables.map((table) => {
          const open = table.bill;
          const covered = open ? open.remainingCents === 0 : false;
          const menuOpen = cardMenuId === table.table.id;
          return (
            <div
              key={table.table.id}
              className={selectedId === table.table.id && wide ? "card mesa selected" : "card mesa"}
            >
              <button className="mesa-main" type="button" onClick={() => openTable(table.table.id)}>
                <span className="mesa-id">
                  <b>{table.table.name}</b>
                  {!open ? (
                    <span className="badge neutral">Libre</span>
                  ) : covered ? (
                    <span className="badge ok">Cubierta</span>
                  ) : (
                    <span className="badge info">Abierta</span>
                  )}
                </span>
                {open ? (
                  <span>
                    <span className="amt num">{formatMXN(open.remainingCents)}</span>
                    <small>restante de {formatMXN(open.totalCents)}</small>
                  </span>
                ) : null}
              </button>
              <div className="mesa-more" ref={menuOpen ? cardMenuRef : undefined}>
                <button
                  className="mesa-dots"
                  type="button"
                  aria-label={`Opciones de ${table.table.name}`}
                  aria-expanded={menuOpen}
                  aria-haspopup="menu"
                  onClick={() => setCardMenuId(menuOpen ? null : table.table.id)}
                >
                  <IconMore />
                </button>
                {menuOpen ? (
                  <div className="more-menu" role="menu">
                    <button role="menuitem" type="button" onClick={() => editAmount(table)}>
                      Editar monto
                    </button>
                    <button role="menuitem" type="button" onClick={() => askRemove(table)}>
                      Eliminar mesa
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const detail = selected?.bill ? (
    <div className="caja-detail">
      <div className="bar detail-bar">
        {wide ? (
          <span className="bar-side" />
        ) : (
          <button className="backb" type="button" aria-label="Volver a las mesas" onClick={() => setMobileDetail(false)}>
            <IconBack />
          </button>
        )}
        <h1 className="detail-title">
          {selected.table.name}
          <small>Cuenta {selected.bill.id}</small>
        </h1>
        {mesaMenu}
      </div>
      <div className="body">
        {copied ? (
          <p className="empty-note" role="status">
            Enlace copiado.
          </p>
        ) : null}
        <AccountCard bill={selected.bill} restLabel="Restante en efectivo" staff freshIds={fresh} />
        {selected.bill.payments.length === 0 ? (
          <p className="empty-note">Aún no entra ningún pago. Aparecen aquí solos.</p>
        ) : null}
        <div className="card kv">
          <div>
            <span>Pagado por transferencia</span>
            <span className="num">{formatMXN(selected.bill.paidCents)}</span>
          </div>
          <div className="t">
            <span>Propinas, aparte</span>
            <span className="num">{formatMXN(selected.bill.tipsCents)}</span>
          </div>
        </div>
      </div>
      <div className="foot">
        {error && sheet !== "close" ? (
          <p className="msg-err" role="alert">
            {error}
          </p>
        ) : null}
        <button className="btn secondary" type="button" onClick={() => setSheet("close")}>
          Cerrar mesa
        </button>
      </div>
    </div>
  ) : null;

  const closeCopy = useMemo(() => {
    if (!selected?.bill) return "";
    if (selected.bill.remainingCents > 0) {
      return `Confirma que ya cobraste ${formatMXN(selected.bill.remainingCents)} en efectivo. La mesa quedará libre.`;
    }
    return "La cuenta está cubierta. La mesa quedará libre.";
  }, [selected]);

  return (
    <div className="caja-page">
      {wide ? (
        <div className="caja-split">
          {list}
          {detail ?? <p className="empty-note caja-empty">Elige una mesa para ver la cuenta.</p>}
        </div>
      ) : showDetail ? (
        detail
      ) : (
        list
      )}
      {sheet === "open" && selected ? (
        <BottomSheet title={`Abrir cuenta · ${selected.table.name}`} onClose={() => setSheet(null)}>
          <form
            onSubmit={(event) => void submitOpen(event)}
            style={{ display: "flex", flexDirection: "column", gap: 14 }}
          >
            <div className="field">
              <label htmlFor="bill-total">Total de la cuenta</label>
              <div className={error ? "input bad" : "input"}>
                <span className="currency">$</span>
                <input
                  id="bill-total"
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  placeholder="0.00"
                  value={total}
                  enterKeyHint="done"
                  onChange={(event) => {
                    setTotal(sanitizePesosInput(event.target.value));
                    setError("");
                  }}
                />
                <em>MXN</em>
              </div>
              {error ? (
                <p className="msg-err" role="alert">
                  {error}
                </p>
              ) : null}
            </div>
            <button className="btn primary" type="submit" disabled={sending}>
              {sending ? "Abriendo cuenta…" : "Abrir cuenta"}
            </button>
            <SheetCancel />
          </form>
        </BottomSheet>
      ) : null}
      {sheet === "share" && selected && mesaUrl ? (
        <BottomSheet title={`Código · ${selected.table.name}`} onClose={() => setSheet(null)}>
          <div className="mesa-share">
            <QrImage value={mesaUrl} label={`Código para abrir ${selected.table.name}`} />
            <p className="mesa-url">{mesaUrl.replace(/^https?:\/\//, "")}</p>
            <button className="btn primary" type="button" onClick={() => void shareLink()}>
              {copied ? "Enlace copiado" : "Enviar enlace"}
            </button>
          </div>
        </BottomSheet>
      ) : null}
      {sheet === "edit" && selected?.bill ? (
        <BottomSheet title={`Editar monto · ${selected.table.name}`} onClose={() => setSheet(null)}>
          <form onSubmit={(event) => void submitEdit(event)} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="field">
              <label htmlFor="edit-total">Total de la cuenta</label>
              <div className={error ? "input bad" : "input"}>
                <span className="currency">$</span>
                <input
                  id="edit-total"
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  placeholder="0.00"
                  value={total}
                  enterKeyHint="done"
                  onChange={(event) => {
                    setTotal(sanitizePesosInput(event.target.value));
                    setError("");
                  }}
                />
                <em>MXN</em>
              </div>
              {error ? (
                <p className="msg-err" role="alert">
                  {error}
                </p>
              ) : null}
            </div>
            <button className="btn primary" type="submit" disabled={sending}>
              {sending ? "Guardando…" : "Guardar monto"}
            </button>
            <SheetCancel />
          </form>
        </BottomSheet>
      ) : null}
      {sheet === "remove" && selected ? (
        <BottomSheet title={`¿Eliminar la ${selected.table.name}?`} onClose={() => setSheet(null)}>
          <p>
            {selected.bill
              ? "Esta mesa tiene una cuenta abierta. Ciérrala antes de quitarla."
              : "Se borra esta mesa. Su código dejará de servir."}
          </p>
          {error ? (
            <p className="msg-err" role="alert">
              {error}
            </p>
          ) : null}
          {selected.bill ? null : (
            <button className="btn primary" type="button" disabled={sending} onClick={() => void submitDelete()}>
              {sending ? "Eliminando mesa…" : "Sí, eliminar mesa"}
            </button>
          )}
          <SheetCancel />
        </BottomSheet>
      ) : null}
      {sheet === "close" && selected ? (
        <BottomSheet title={`¿Cerrar la ${selected.table.name}?`} onClose={() => setSheet(null)}>
          <p>{closeCopy}</p>
          <button className="btn primary" type="button" disabled={sending} onClick={() => void submitClose()}>
            {sending ? "Cerrando mesa…" : "Sí, cerrar mesa"}
          </button>
          <SheetCancel />
        </BottomSheet>
      ) : null}
    </div>
  );
}
