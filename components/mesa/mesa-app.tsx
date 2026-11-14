"use client";

import { useEffect, useMemo, useState } from "react";
import { AccountCard } from "@/components/ui/account-card";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { IconCheck, IconGo, IconLock, IconPhone, IconQr, IconReceipt } from "@/components/ui/icons";
import { qrPng, QrImage } from "@/components/ui/qr-image";
import { ShopBar } from "@/components/ui/shop-bar";
import { formatMXN, parsePesosToCents } from "@/lib/money";
import type { Snapshot } from "@/lib/types";
import { useLiveSnapshot } from "@/lib/use-live-snapshot";

type TipMode = "0" | "10" | "15" | "20" | "otra";
type View = "pay" | "qr" | "pn" | "done";
type Sheet = null | "method" | "phone";

type Session = {
  paymentId: number;
  method: "qr" | "pn";
  qrString?: string;
  expiresAt: string;
  amountCents: number;
  tipCents: number;
  phoneLast4?: string;
};

const TIPS: { id: TipMode; label: string }[] = [
  { id: "0", label: "No" },
  { id: "10", label: "10%" },
  { id: "15", label: "15%" },
  { id: "20", label: "20%" },
  { id: "otra", label: "Otra" },
];

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
    tip = tipMode === "otra" ? (tipCustom.trim() ? parsePesosToCents(tipCustom) : 0) : Math.round((part * Number(tipMode)) / 100);
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
  const [session, setSession] = useState<Session | null>(null);
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
      const body = (await response.json()) as { error?: string; paymentId?: number; qrString?: string; expiresAt?: string };
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

  useEffect(() => {
    if (view !== "qr" || !session?.qrString) return;
    void qrPng(session.qrString).then((blob) => {
      const file = new File([blob], "codigo-codi.png", { type: "image/png" });
      setCanShare(Boolean(navigator.canShare?.({ files: [file] })));
    });
  }, [view, session?.qrString]);

  const expired = session ? new Date(session.expiresAt).getTime() <= now : false;
  const remainMs = session ? Math.max(0, new Date(session.expiresAt).getTime() - now) : 0;
  const remainSeconds = Math.ceil(remainMs / 1000);
  const remainLabel = `${Math.floor(remainSeconds / 60)}:${String(remainSeconds % 60).padStart(2, "0")}`;
  const showError = quote.error || formError;
  const connectionError = offline || live.error;

  if (!bill) {
    return (
      <div className="diner-col">
        <ShopBar restaurant={restaurant} end={<span className="badge neutral">{snapshot.table.name}</span>} />
        <div className="body">
          <div className="center grow">
            <div className="icoc">
              <IconReceipt />
            </div>
            <p className="title">Esta mesa no tiene cuenta abierta</p>
            <p>Pídela a tu mesero.</p>
          </div>
        </div>
      </div>
    );
  }

  if (view === "done" && session) {
    return (
      <div className="diner-col">
        <ShopBar restaurant={restaurant} end={<span className="badge neutral">{snapshot.table.name}</span>} />
        <div className="body">
          <div className="center grow">
            <div className="okc">
              <IconCheck />
            </div>
            <p className="title">Pago recibido</p>
            <p className="huge num">{formatMXN(session.amountCents + session.tipCents)}</p>
            <div className="card kv">
              <div>
                <span>Tu parte</span>
                <span className="num">{formatMXN(session.amountCents)}</span>
              </div>
              <div className="t">
                <span>Propina</span>
                <span className="num">{formatMXN(session.tipCents)}</span>
              </div>
              <div>
                <span>Restante de la mesa</span>
                <span className="num">{bill.remainingCents === 0 ? "Cubierta" : formatMXN(bill.remainingCents)}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="foot">
          <button
            className="btn primary"
            type="button"
            onClick={() => {
              setView("pay");
              setSession(null);
              setAmount("");
              setTipMode("0");
              setTipCustom("");
              setName("");
            }}
          >
            Listo
          </button>
        </div>
      </div>
    );
  }

  if ((view === "qr" || view === "pn") && session) {
    const total = formatMXN(session.amountCents + session.tipCents);
    return (
      <div className="diner-col">
        <div className="bar">
          <button
            className="backb"
            type="button"
            aria-label="Cambiar monto"
            onClick={() => {
              setView("pay");
              setSession(null);
            }}
          >
            <svg className="i" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </button>
          <span className="name num">
            Pagar {total}
            <small>
              {snapshot.table.name} · cuenta {bill.id}
            </small>
          </span>
        </div>
        {view === "qr" && session.qrString ? (
          <div className="body">
            <div className="center">
              <QrImage value={session.qrString} dim={expired} />
              <span className="status" role="status">
                {expired ? null : <span className="spin" />}
                {expired ? "Este código venció" : `Esperando tu pago · vence en ${remainLabel}`}
              </span>
              <ol className="card how">
                <li>
                  <b>1</b>Guarda el código en tus fotos
                </li>
                <li>
                  <b>2</b>Abre la app de tu banco y entra a CoDi
                </li>
                <li>
                  <b>3</b>Elige leer el código desde una imagen
                </li>
              </ol>
              {mockMode ? <Simulate paymentId={session.paymentId} /> : null}
            </div>
          </div>
        ) : (
          <div className="body">
            <div className="center grow">
              <div className="icoc">
                <IconPhone />
              </div>
              <p className="title">Revisa la app de tu banco</p>
              <p>
                Te enviamos un cobro por <b className="num">{total}</b> al celular terminado en {session.phoneLast4}.
              </p>
              <span className="status" role="status">
                <span className="spin" />
                Esperando tu pago
              </span>
              {mockMode ? <Simulate paymentId={session.paymentId} /> : null}
            </div>
          </div>
        )}
        <div className="foot">
          {connectionError ? (
            <p className="banner" role="alert">
              No pudimos conectar. Revisa tu internet e inténtalo de nuevo.
            </p>
          ) : null}
          {view === "qr" ? (
            <>
              <button
                className="btn primary"
                type="button"
                disabled={sending}
                onClick={() => (expired ? void createCharge("qr") : void saveQr())}
              >
                {expired ? (
                  "Generar otro código"
                ) : saved ? (
                  <>
                    <IconCheck /> Guardado en tus fotos
                  </>
                ) : (
                  "Guardar código"
                )}
              </button>
              {canShare && !expired ? (
                <button className="btn secondary" type="button" onClick={() => void shareQr()}>
                  Compartir
                </button>
              ) : null}
            </>
          ) : (
            <button className="btn secondary" type="button" disabled={sending} onClick={() => void createCharge("qr")}>
              Mejor usar código QR
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="diner-col">
      <ShopBar restaurant={restaurant} end={<span className="badge neutral">{snapshot.table.name}</span>} />
      <div className="body">
        <AccountCard bill={bill} restLabel="Restante" staff={false} />
        {bill.remainingCents === 0 ? (
          <div className="center grow">
            <div className="okc">
              <IconCheck />
            </div>
            <p className="title">No falta nada por pagar</p>
            <p>La cuenta ya está cubierta.</p>
          </div>
        ) : (
          <>
            <div className="field">
              <label htmlFor="amount">¿Cuánto pagas tú?</label>
              <div className={showError ? "input bad" : "input"}>
                <span className="currency">$</span>
                <input
                  id="amount"
                  inputMode="decimal"
                  autoComplete="off"
                  enterKeyHint="done"
                  placeholder="0.00"
                  value={amount}
                  onChange={(event) => {
                    setAmount(event.target.value);
                    setFormError("");
                  }}
                />
                <em>MXN</em>
              </div>
              {showError ? (
                <p className="msg-err" role="alert">
                  {formError || quote.error}
                </p>
              ) : null}
              <button
                className="link"
                type="button"
                onClick={() => setAmount((bill.remainingCents / 100).toFixed(2))}
              >
                Pagar todo el restante
              </button>
            </div>
            <div className="field">
              <div className="field-head">
                <span className="flabel">Propina</span>
                <span className="tipval num">{quote.tip > 0 ? `+ ${formatMXN(quote.tip)}` : ""}</span>
              </div>
              <div className="opts" role="group" aria-label="Propina">
                {TIPS.map((tip) => (
                  <button
                    key={tip.id}
                    className="optb"
                    type="button"
                    aria-pressed={tipMode === tip.id}
                    onClick={() => setTipMode(tip.id)}
                  >
                    {tip.label}
                  </button>
                ))}
              </div>
              {tipMode === "otra" ? (
                <div className="input">
                  <span className="currency">$</span>
                  <input
                    inputMode="decimal"
                    autoComplete="off"
                    placeholder="0.00"
                    aria-label="Propina en pesos"
                    value={tipCustom}
                    onChange={(event) => setTipCustom(event.target.value)}
                  />
                  <em>MXN</em>
                </div>
              ) : null}
            </div>
            <div className="field">
              <label htmlFor="payer-name">
                Tu nombre <span className="opt-note">(opcional)</span>
              </label>
              <div className="input">
                <input
                  id="payer-name"
                  maxLength={20}
                  autoComplete="given-name"
                  placeholder="Para que la mesa vea quién pagó"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  style={{ fontSize: 16, fontWeight: 500 }}
                />
              </div>
            </div>
          </>
        )}
      </div>
      {bill.remainingCents > 0 ? (
        <div className="foot">
          {connectionError ? (
            <p className="banner" role="alert">
              No pudimos conectar. Revisa tu internet e inténtalo de nuevo.
            </p>
          ) : null}
          <button
            className="btn primary"
            type="button"
            disabled={sending || (!quote.ok && !connectionError)}
            onClick={() => {
              if (connectionError) {
                void reload();
                return;
              }
              setSheet("method");
            }}
          >
            <span>
              {connectionError ? "Reintentar" : sending ? "Creando cobro…" : quote.ok ? `Pagar ${formatMXN(quote.sum)}` : "Pagar"}
            </span>
            <IconLock />
          </button>
          <p className="assure">Pagas desde la app de tu banco. Sin comisión.</p>
        </div>
      ) : null}
      {sheet === "method" ? (
        <BottomSheet title="¿Cómo quieres pagar?" onClose={() => setSheet(null)}>
          <button className="opt" type="button" onClick={() => setSheet("phone")}>
            <span className="ic">
              <IconPhone />
            </span>
            <span>
              <b>Cobro a mi celular</b>
              <small>Te llega a la app de tu banco</small>
            </span>
            <span className="go">
              <IconGo />
            </span>
          </button>
          <button className="opt" type="button" disabled={sending} onClick={() => void createCharge("qr")}>
            <span className="ic">
              <IconQr />
            </span>
            <span>
              <b>Código QR</b>
              <small>Para guardarlo o escanearlo</small>
            </span>
            <span className="go">
              <IconGo />
            </span>
          </button>
          <button className="btn quiet" type="button" onClick={() => setSheet(null)}>
            Cancelar
          </button>
        </BottomSheet>
      ) : null}
      {sheet === "phone" ? (
        <BottomSheet title="¿A qué celular enviamos el cobro?" onClose={() => setSheet(null)}>
          <p>El que tienes registrado en tu banco. Solo lo usamos para este cobro y no lo guardamos.</p>
          <div className="input">
            <input
              className="num"
              inputMode="numeric"
              autoComplete="tel-national"
              maxLength={10}
              placeholder="10 dígitos"
              aria-label="Celular a 10 dígitos"
              value={phone}
              onChange={(event) => setPhone(event.target.value.replace(/\D/g, "").slice(0, 10))}
            />
          </div>
          {formError ? (
            <p className="msg-err" role="alert">
              {formError}
            </p>
          ) : null}
          <button
            className="btn primary"
            type="button"
            disabled={!/^\d{10}$/.test(phone) || sending}
            onClick={() => void createCharge("pn", phone)}
          >
            {sending ? "Enviando cobro…" : `Enviar cobro de ${formatMXN(quote.sum)}`}
          </button>
          <button className="btn quiet" type="button" onClick={() => setSheet(null)}>
            Cancelar
          </button>
        </BottomSheet>
      ) : null}
    </div>
  );
}

function Simulate({ paymentId }: { paymentId: number }) {
  const [busy, setBusy] = useState(false);
  return (
    <div className="demo">
      <p>Solo para demostración. Aquí la persona paga en su banco.</p>
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          await fetch("/api/dev/simulate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentId }),
          });
          setBusy(false);
        }}
      >
        Simular pago
      </button>
    </div>
  );
}
