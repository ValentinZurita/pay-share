"use client";

import { useEffect, useMemo, useState } from "react";
import { PaymentForm } from "@/components/mesa/payment-form";
import { PaymentMethodSheet, PhoneChargeSheet } from "@/components/mesa/payment-sheets";
import { ActivePaymentView, PaymentDoneView, type PaymentSession } from "@/components/mesa/payment-views";
import type { TipMode } from "@/components/mesa/tip-selector";
import { AccountCard } from "@/components/ui/account-card";
import { Badge } from "@/components/ui/badge";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { IconCheck, IconLock, IconReceipt } from "@/components/ui/icons";
import { DinerShell, FooterBar, ScrollBody } from "@/components/ui/page-shell";
import { qrPng } from "@/components/ui/qr-image";
import { ShopBar } from "@/components/ui/shop-bar";
import { formatMXN, parsePesosToCents } from "@/lib/money";
import type { Snapshot } from "@/lib/types";
import { useLiveSnapshot } from "@/lib/use-live-snapshot";

type View = "pay" | "qr" | "pn" | "done";
type Sheet = null | "method" | "phone";

function assess(amount: string, remaining: number, tipMode: TipMode, tipCustom: string) {
  if (!amount.trim()) return { part: 0, tip: 0, error: "", ok: false, sum: 0 };
  let part = 0;
  try {
    part = parsePesosToCents(amount);
  } catch {
    return { part: 0, tip: 0, error: "Escribe solo el monto, por ejemplo 300.", ok: false, sum: 0 };
  }
  if (part <= 0) {
    return { part, tip: 0, error: "Escribe solo el monto, por ejemplo 300.", ok: false, sum: 0 };
  }
  if (part > remaining) {
    return { part, tip: 0, error: `El restante es ${formatMXN(remaining)}.`, ok: false, sum: 0 };
  }
  let tip = 0;
  try {
    tip =
      tipMode === "otra"
        ? tipCustom.trim()
          ? parsePesosToCents(tipCustom)
          : 0
        : Math.round((part * Number(tipMode)) / 100);
  } catch {
    return { part, tip: 0, error: "La propina debe ser un monto, por ejemplo 30.", ok: false, sum: 0 };
  }
  return { part, tip, error: "", ok: part > 0, sum: part + tip };
}

function useNow() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  return now;
}

export function MesaApp({
  initial,
  restaurant,
  mockMode,
}: {
  initial: Snapshot;
  restaurant: string;
  mockMode: boolean;
}) {
  const live = useLiveSnapshot(initial.table.id, initial);
  const reload = live.reload;
  const snapshot = (live.data as Snapshot | null) ?? initial;
  const bill = snapshot.bill;

  const [view, setView] = useState<View>("pay");
  const [sheet, setSheet] = useState<Sheet>(null);
  const [amount, setAmount] = useState("");
  const [tipMode, setTipMode] = useState<TipMode>("0");
  const [tipCustom, setTipCustom] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [session, setSession] = useState<PaymentSession | null>(null);
  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState("");
  const [saved, setSaved] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const [offline, setOffline] = useState(false);
  const now = useNow();

  const quote = useMemo(
    () => assess(amount, bill?.remainingCents ?? 0, tipMode, tipCustom),
    [amount, bill?.remainingCents, tipMode, tipCustom],
  );

  useEffect(() => {
    const sync = () => setOffline(typeof navigator !== "undefined" && !navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  useEffect(() => {
    if (!session || view === "done" || view === "pay") return;
    let stop = false;
    async function tick() {
      if (!session) return;
      try {
        const response = await fetch(`/api/payments/${session.paymentId}`, { cache: "no-store" });
        if (!response.ok) return;
        const body = (await response.json()) as { status: string };
        if (!stop && body.status === "paid") {
          setView("done");
          void reload();
        }
      } catch {
        setOffline(true);
      }
    }
    void tick();
    const timer = window.setInterval(() => void tick(), 4000);
    const onVisible = () => {
      if (document.visibilityState === "visible") void tick();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      stop = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [session, view, reload]);

  useEffect(() => {
    if (view !== "qr" || !session?.qrString) return;
    void qrPng(session.qrString).then((blob) => {
      const file = new File([blob], "codigo-codi.png", { type: "image/png" });
      setCanShare(Boolean(navigator.canShare?.({ files: [file] })));
    });
  }, [view, session?.qrString]);

  async function createCharge(method: "qr" | "pn", phoneDigits?: string) {
    if (!bill || !quote.ok || sending) return;
    setSending(true);
    setFormError("");
    try {
      const response = await fetch("/api/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          billId: bill.id,
          amountCents: quote.part,
          tipCents: quote.tip,
          method,
          phone: phoneDigits,
          name: name.trim() || undefined,
        }),
      });
      const body = (await response.json()) as {
        error?: string;
        paymentId?: number;
        qrString?: string;
        expiresAt?: string;
      };
      if (!response.ok || !body.paymentId || !body.expiresAt) {
        setFormError(body.error ?? "No se pudo crear el cobro. Inténtalo de nuevo.");
        setSheet(method === "pn" ? "phone" : null);
        return;
      }
      setSession({
        paymentId: body.paymentId,
        method,
        qrString: body.qrString,
        expiresAt: body.expiresAt,
        amountCents: quote.part,
        tipCents: quote.tip,
        phoneLast4: phoneDigits?.slice(-4),
      });
      setSaved(false);
      setSheet(null);
      setView(method);
    } catch {
      setFormError("No pudimos conectar. Revisa tu internet e inténtalo de nuevo.");
    } finally {
      setSending(false);
    }
  }

  async function saveQr() {
    if (!session?.qrString) return;
    const blob = await qrPng(session.qrString);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "codigo-codi.png";
    link.click();
    URL.revokeObjectURL(url);
    setSaved(true);
  }

  async function shareQr() {
    if (!session?.qrString) return;
    const blob = await qrPng(session.qrString);
    const file = new File([blob], "codigo-codi.png", { type: "image/png" });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: "Código para pagar" });
      setCanShare(true);
    }
  }

  const expired = session ? new Date(session.expiresAt).getTime() <= now : false;
  const remainMs = session ? Math.max(0, new Date(session.expiresAt).getTime() - now) : 0;
  const remainSeconds = Math.ceil(remainMs / 1000);
  const remainLabel = `${Math.floor(remainSeconds / 60)}:${String(remainSeconds % 60).padStart(2, "0")}`;
  const showError = quote.error || formError;
  const connectionError = Boolean(offline || live.error);

  if (!bill) {
    return (
      <DinerShell>
        <ShopBar restaurant={restaurant} end={<Badge variant="neutral">{snapshot.table.name}</Badge>} />
        <ScrollBody>
          <EmptyState
            icon={<IconReceipt />}
            title="Esta mesa no tiene cuenta abierta"
            description="Pídela a tu mesero."
          />
        </ScrollBody>
      </DinerShell>
    );
  }

  if (view === "done" && session) {
    return (
      <PaymentDoneView
        restaurant={restaurant}
        tableName={snapshot.table.name}
        session={session}
        remainingCents={bill.remainingCents}
        onDone={() => {
          setView("pay");
          setSession(null);
          setAmount("");
          setTipMode("0");
          setTipCustom("");
          setName("");
        }}
      />
    );
  }

  if ((view === "qr" || view === "pn") && session) {
    return (
      <ActivePaymentView
        session={session}
        tableName={snapshot.table.name}
        billId={bill.id}
        expired={expired}
        remainLabel={remainLabel}
        saved={saved}
        canShare={canShare}
        sending={sending}
        connectionError={connectionError}
        mockMode={mockMode}
        onBack={() => {
          setView("pay");
          setSession(null);
        }}
        onRegenerateQr={() => void createCharge("qr")}
        onSaveQr={() => void saveQr()}
        onShareQr={() => void shareQr()}
        onSwitchToQr={() => void createCharge("qr")}
      />
    );
  }

  return (
    <DinerShell>
      <ShopBar restaurant={restaurant} end={<Badge variant="neutral">{snapshot.table.name}</Badge>} />
      <ScrollBody>
        <AccountCard bill={bill} restLabel="Restante" staff={false} />
        {bill.remainingCents === 0 ? (
          <EmptyState
            tone="success"
            icon={<IconCheck />}
            title="No falta nada por pagar"
            description="La cuenta ya está cubierta."
          />
        ) : (
          <PaymentForm
            amount={amount}
            tipMode={tipMode}
            tipCustom={tipCustom}
            tipCents={quote.tip}
            name={name}
            error={showError}
            onAmountChange={(value) => {
              setAmount(value);
              setFormError("");
            }}
            onPayRemaining={() => setAmount((bill.remainingCents / 100).toFixed(2))}
            onTipModeChange={setTipMode}
            onTipCustomChange={setTipCustom}
            onNameChange={setName}
          />
        )}
      </ScrollBody>

      {bill.remainingCents > 0 ? (
        <FooterBar>
          {connectionError ? (
            <Banner>No pudimos conectar. Revisa tu internet e inténtalo de nuevo.</Banner>
          ) : null}
          <Button
            variant="primary"
            disabled={sending || (!quote.ok && !connectionError)}
            iconEnd={<IconLock />}
            onClick={() => {
              if (connectionError) {
                void reload();
                return;
              }
              setSheet("method");
            }}
          >
            {connectionError
              ? "Reintentar"
              : sending
                ? "Creando cobro…"
                : quote.ok
                  ? `Pagar ${formatMXN(quote.sum)}`
                  : "Pagar"}
          </Button>
          <p className="m-0 text-center text-[12.5px] text-muted">
            Pagas desde la app de tu banco. Sin comisión.
          </p>
        </FooterBar>
      ) : null}

      {sheet === "method" ? (
        <PaymentMethodSheet
          sending={sending}
          onClose={() => setSheet(null)}
          onSelectPhone={() => setSheet("phone")}
          onSelectQr={() => void createCharge("qr")}
        />
      ) : null}

      {sheet === "phone" ? (
        <PhoneChargeSheet
          phone={phone}
          totalCents={quote.sum}
          error={formError}
          sending={sending}
          onPhoneChange={setPhone}
          onSubmit={() => void createCharge("pn", phone)}
          onClose={() => setSheet(null)}
        />
      ) : null}
    </DinerShell>
  );
}
