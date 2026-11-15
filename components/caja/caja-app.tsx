"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { TableDetail } from "@/components/caja/table-detail";
import { TableGrid } from "@/components/caja/table-grid";
import { BrandBar, cajaSubtitle } from "@/components/ui/brand-bar";
import {
  BillAmountSheet,
  CloseTableSheet,
  RemoveTableSheet,
  ShareTableSheet,
} from "@/components/caja/table-sheets";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import { formatMXN, parsePesosToCents } from "@/lib/money";
import type { Snapshot } from "@/lib/types";
import { useLiveSnapshot } from "@/lib/use-live-snapshot";

type Sheet = null | "open" | "close" | "share" | "remove" | "edit";

const emptySubscribe = () => () => {};

function useOrigin() {
  return useSyncExternalStore(
    emptySubscribe,
    () => window.location.origin,
    () => "",
  );
}

export function CajaApp({ initial }: { initial: Snapshot[] }) {
  const live = useLiveSnapshot(null, initial);
  const tables = (Array.isArray(live.data) ? live.data : initial) as Snapshot[];
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [mobileDetail, setMobileDetail] = useState(false);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [total, setTotal] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const seen = useRef<Set<number>>(new Set());
  const ready = useRef(false);
  const [fresh, setFresh] = useState<Set<number>>(new Set());
  const origin = useOrigin();

  const selected = tables.find((table) => table.table.id === selectedId) ?? null;

  useEffect(() => {
    const ids = tables.flatMap(
      (table) =>
        table.bill?.payments.filter((payment) => payment.status === "paid").map((payment) => payment.id) ?? [],
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
    if (!table?.bill) {
      setSheet("open");
      setMobileDetail(false);
      return;
    }
    setSheet(null);
    setMobileDetail(true);
  }

  function parseTotalOrError(): number | null {
    try {
      const cents = parsePesosToCents(total);
      if (cents <= 0) {
        setError("Escribe el total, por ejemplo 500.");
        return null;
      }
      return cents;
    } catch {
      setError("Escribe el total, por ejemplo 500.");
      return null;
    }
  }

  async function submitBillAmount(mode: "open" | "edit", event: React.FormEvent) {
    event.preventDefault();
    if (sending) return;
    if (mode === "open" && !selectedId) return;
    if (mode === "edit" && !selected?.bill) return;

    const cents = parseTotalOrError();
    if (cents == null) return;

    setSending(true);
    setError("");
    try {
      const url = mode === "open" ? "/api/bills" : `/api/bills/${selected!.bill!.id}`;
      const method = mode === "open" ? "POST" : "PATCH";
      const payload = mode === "open" ? { tableId: selectedId, totalCents: cents } : { totalCents: cents };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(
          body.error ?? (mode === "open" ? "No pudimos abrir la cuenta." : "No pudimos guardar el monto."),
        );
        return;
      }
      setSheet(null);
      if (mode === "open") setMobileDetail(true);
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
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      try {
        await navigator.clipboard.writeText(mesaUrl);
        setCopied(true);
      } catch {
        setError("No pudimos compartir el enlace.");
      }
    }
  }

  const closeCopy = useMemo(() => {
    if (!selected?.bill) return "";
    if (selected.bill.remainingCents > 0) {
      return `Confirma que ya cobraste ${formatMXN(selected.bill.remainingCents)} en efectivo. La mesa quedará libre.`;
    }
    return "La cuenta está cubierta. La mesa quedará libre.";
  }, [selected]);

  const showDetail = Boolean(selected?.bill) && mobileDetail;
  const restaurant = process.env.NEXT_PUBLIC_RESTAURANT_NAME?.trim() ?? "";
  const openCount = tables.filter((table) => table.bill).length;

  return (
    <div className="mx-auto flex h-(--app-height,100dvh) w-full max-w-[1360px] flex-col overflow-hidden bg-bg">
      <div className="flex min-h-0 flex-1 flex-col min-[900px]:grid min-[900px]:grid-cols-[minmax(0,1fr)_400px] min-[900px]:grid-rows-[minmax(0,1fr)] min-[900px]:items-stretch min-[900px]:gap-7 min-[900px]:p-6 min-[900px]:px-7 min-[900px]:pb-7 min-[1200px]:grid-cols-[minmax(0,1fr)_440px] min-[1200px]:gap-8 min-[1200px]:px-9 min-[1200px]:pt-7 min-[1200px]:pb-8">
        <div className={cn("ps-shell relative min-h-0 min-w-0 flex-1 flex-col min-[900px]:flex", showDetail ? "hidden" : "flex")}>
          <BrandBar subtitle={cajaSubtitle(restaurant)} chip={`${openCount} abiertas`} />
          <TableGrid
            tables={tables}
            selectedId={selectedId}
            sending={sending}
            error={error && !showDetail ? error : ""}
            liveError={live.error}
            onAddTable={() => void addTable()}
            onSelectTable={openTable}
            onEditAmount={(table) => {
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
            }}
            onRemoveTable={(table) => {
              setSelectedId(table.table.id);
              setError("");
              setSheet("remove");
            }}
          />
        </div>

        <div className={cn("min-h-0 min-w-0 flex-1 flex-col min-[900px]:flex", showDetail ? "flex" : "hidden")}>
          {selected?.bill ? (
            <TableDetail
              table={selected.table}
              bill={selected.bill}
              freshIds={fresh}
              copied={copied}
              error={error && sheet !== "close" ? error : ""}
              onBack={() => setMobileDetail(false)}
              onShowShare={() => setSheet("share")}
              onShareLink={() => void shareLink()}
              onRequestClose={() => setSheet("close")}
            />
          ) : (
            <Card
              variant="dashed"
              className="m-0 grid h-full place-items-center p-8 text-center text-[13.5px] text-muted"
            >
              Elige una mesa para ver la cuenta.
            </Card>
          )}
        </div>
      </div>

      {(sheet === "open" || sheet === "edit") && selected ? (
        <BillAmountSheet
          mode={sheet}
          tableName={selected.table.name}
          total={total}
          error={error}
          sending={sending}
          onTotalChange={(value) => {
            setTotal(value);
            setError("");
          }}
          onSubmit={(event) => void submitBillAmount(sheet, event)}
          onClose={() => setSheet(null)}
        />
      ) : null}

      {sheet === "share" && selected && mesaUrl ? (
        <ShareTableSheet
          tableName={selected.table.name}
          mesaUrl={mesaUrl}
          copied={copied}
          onShareLink={() => void shareLink()}
          onClose={() => setSheet(null)}
        />
      ) : null}

      {sheet === "remove" && selected ? (
        <RemoveTableSheet
          tableName={selected.table.name}
          hasOpenBill={Boolean(selected.bill)}
          error={error}
          sending={sending}
          onConfirm={() => void submitDelete()}
          onClose={() => setSheet(null)}
        />
      ) : null}

      {sheet === "close" && selected ? (
        <CloseTableSheet
          tableName={selected.table.name}
          copy={closeCopy}
          sending={sending}
          onConfirm={() => void submitClose()}
          onClose={() => setSheet(null)}
        />
      ) : null}
    </div>
  );
}
