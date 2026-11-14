"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AccountCard } from "@/components/ui/account-card";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { IconBack } from "@/components/ui/icons";
import { ShopBar } from "@/components/ui/shop-bar";
import { formatMXN, parsePesosToCents } from "@/lib/money";
import type { Snapshot } from "@/lib/types";
import { useLiveSnapshot } from "@/lib/use-live-snapshot";

export function CajaApp({
  initial,
  restaurant,
  memory,
}: {
  initial: Snapshot[];
  restaurant: string;
  memory: boolean;
}) {
  const live = useLiveSnapshot(null, initial);
  const tables = (Array.isArray(live.data) ? live.data : initial) as Snapshot[];
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [mobileDetail, setMobileDetail] = useState(false);
  const [wide, setWide] = useState(false);
  const [sheet, setSheet] = useState<null | "open" | "close">(null);
  const [total, setTotal] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const seen = useRef<Set<number>>(new Set());
  const ready = useRef(false);
  const [fresh, setFresh] = useState<Set<number>>(new Set());

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

  const showDetail = Boolean(selected?.bill) && (wide || mobileDetail);

  const list = (
    <div className="body">
      <h1 className="h-page">Mesas</h1>
      {memory ? <p className="memory">Modo local: los datos se borran al reiniciar. Conecta Supabase para guardarlos.</p> : null}
      {live.error ? (
        <p className="banner" role="alert">
          {live.error}
        </p>
      ) : null}
      <div className="grid">
        {tables.map((table) => {
          const open = table.bill;
          const covered = open ? open.remainingCents === 0 : false;
          return (
            <button
              key={table.table.id}
              className={selectedId === table.table.id && wide ? "card mesa selected" : "card mesa"}
              type="button"
              onClick={() => openTable(table.table.id)}
            >
              <span className="mesa-top">
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
              ) : (
                <small>Toca para abrir cuenta</small>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  const detail = selected?.bill ? (
    <div className={wide ? "caja-detail" : undefined}>
      {wide ? null : (
        <div className="bar">
          <button className="backb" type="button" aria-label="Volver a las mesas" onClick={() => setMobileDetail(false)}>
            <IconBack />
          </button>
          <span className="name">
            {selected.table.name}
            <small>Cuenta {selected.bill.id}</small>
          </span>
        </div>
      )}
      <div className="body">
        {wide ? (
          <h1 className="h-page">
            {selected.table.name}
            <small style={{ display: "block", fontSize: 13, fontWeight: 400, color: "var(--muted)" }}>
              Cuenta {selected.bill.id}
            </small>
          </h1>
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
      {wide || !showDetail ? <ShopBar restaurant={restaurant} end={<span className="badge info">Caja</span>} /> : null}
      {wide ? (
        <div className="caja-split">
          {list}
          {detail ?? <p className="empty-note">Elige una mesa para ver la cuenta.</p>}
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
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder="0.00"
                  value={total}
                  autoFocus
                  onChange={(event) => {
                    setTotal(event.target.value);
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
            <button className="btn quiet" type="button" onClick={() => setSheet(null)}>
              Cancelar
            </button>
          </form>
        </BottomSheet>
      ) : null}
      {sheet === "close" && selected ? (
        <BottomSheet title={`¿Cerrar la ${selected.table.name}?`} onClose={() => setSheet(null)}>
          <p>{closeCopy}</p>
          <button className="btn primary" type="button" disabled={sending} onClick={() => void submitClose()}>
            {sending ? "Cerrando mesa…" : "Sí, cerrar mesa"}
          </button>
          <button className="btn quiet" type="button" onClick={() => setSheet(null)}>
            Cancelar
          </button>
        </BottomSheet>
      ) : null}
    </div>
  );
}
