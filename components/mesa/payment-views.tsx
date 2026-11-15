"use client";

import { useState } from "react";
import { Banner } from "@/components/ui/banner";
import { BrandBar } from "@/components/ui/brand-bar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { IconBack, IconCheck, IconPhone } from "@/components/ui/icons";
import { DinerShell, FooterBar, ScrollBody } from "@/components/ui/page-shell";
import { QrImage } from "@/components/ui/qr-image";
import { StatusPill } from "@/components/ui/status-pill";
import { formatMXN } from "@/lib/money";

export interface PaymentSession {
  paymentId: number;
  method: "qr" | "pn";
  qrString?: string;
  expiresAt: string;
  amountCents: number;
  tipCents: number;
  phoneLast4?: string;
}

const QR_STEPS = [
  "Guarda el código en tus fotos",
  "Abre la app de tu banco y entra a CoDi",
  "Elige leer el código desde una imagen",
];

function SimulateBox({ paymentId }: { paymentId: number }) {
  const [busy, setBusy] = useState(false);
  return (
    <div className="ps-demo text-center">
      <p className="m-0 text-[12px] text-muted">
        Solo para demostración. Aquí la persona paga en su banco.
      </p>
      <Button
        variant="secondary"
        size="compact"
        fullWidth
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
      </Button>
    </div>
  );
}

/**
 * Active CoDi payment view (QR or phone push) with live status and actions.
 */
export function ActivePaymentView({
  session,
  tableName,
  billId,
  expired,
  remainLabel,
  saved,
  canShare,
  sending,
  connectionError,
  mockMode,
  onBack,
  onRegenerateQr,
  onSaveQr,
  onShareQr,
  onSwitchToQr,
}: {
  session: PaymentSession;
  tableName: string;
  billId: number;
  expired: boolean;
  remainLabel: string;
  saved: boolean;
  canShare: boolean;
  sending: boolean;
  connectionError: boolean;
  mockMode: boolean;
  onBack: () => void;
  onRegenerateQr: () => void;
  onSaveQr: () => void;
  onShareQr: () => void;
  onSwitchToQr: () => void;
}) {
  const total = formatMXN(session.amountCents + session.tipCents);
  const isQr = session.method === "qr" && Boolean(session.qrString);

  return (
    <DinerShell>
      <BrandBar
        title={`Pagar ${total}`}
        subtitle={`${tableName} · cuenta ${billId}`}
        showTheme={false}
        leading={
          <button type="button" className="ps-round" aria-label="Cambiar monto" onClick={onBack}>
            <IconBack />
          </button>
        }
      />

      {isQr && session.qrString ? (
        <ScrollBody>
          <div className="flex flex-col items-center gap-3 text-center">
            <QrImage value={session.qrString} dim={expired} label={`Código QR de CoDi por ${total}`} />
            <StatusPill loading={!expired}>
              {expired ? "Este código venció" : `Esperando tu pago · vence en ${remainLabel}`}
            </StatusPill>
            <ol className="ps-steps">
              {QR_STEPS.map((step, index) => (
                <li key={step}>
                  <i>{index + 1}</i>
                  {step}
                </li>
              ))}
            </ol>
            {mockMode ? <SimulateBox paymentId={session.paymentId} /> : null}
          </div>
        </ScrollBody>
      ) : (
        <ScrollBody>
          <EmptyState
            className="ps-phone-wait"
            icon={<IconPhone />}
            title="Revisa la app de tu banco"
            description={
              <>
                Te enviamos un cobro por <b className="num">{total}</b> al celular terminado en{" "}
                {session.phoneLast4}.
              </>
            }
          >
            <StatusPill loading>Esperando tu pago</StatusPill>
            {mockMode ? <SimulateBox paymentId={session.paymentId} /> : null}
          </EmptyState>
        </ScrollBody>
      )}

      <FooterBar tone="integrated">
        {connectionError ? (
          <Banner>No pudimos conectar. Revisa tu internet e inténtalo de nuevo.</Banner>
        ) : null}
        {isQr ? (
          <>
            <Button
              variant="primary"
              disabled={sending}
              onClick={() => (expired ? onRegenerateQr() : onSaveQr())}
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
            </Button>
            {canShare && !expired ? (
            <Button variant="quiet" onClick={onShareQr}>
              Compartir
            </Button>
            ) : null}
          </>
        ) : (
          <Button variant="secondary" disabled={sending} onClick={onSwitchToQr}>
            Mejor usar código QR
          </Button>
        )}
      </FooterBar>
    </DinerShell>
  );
}

/**
 * Confirmation view shown once the diner's payment is settled.
 */
function clockLabel(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "America/Mexico_City",
  }).format(date);
}

export function PaymentDoneView({
  tableName,
  restaurant,
  session,
  remainingCents,
  paidAt,
  onDone,
}: {
  tableName: string;
  restaurant: string;
  session: PaymentSession;
  remainingCents: number;
  paidAt?: string | null;
  onDone: () => void;
}) {
  const when = paidAt ? clockLabel(paidAt) : "";
  const method = session.method === "qr" ? "CoDi · QR" : "CoDi · celular";

  return (
    <DinerShell>
      <BrandBar subtitle="Paga con CoDi" chip={tableName} />
      <ScrollBody>
        <div className="ps-done">
          <span className="ps-done-check">
            <IconCheck />
          </span>
          <h1 className="ps-done-title" role="status">
            Pago recibido
          </h1>
          <p className="ps-done-amt">{formatMXN(session.amountCents + session.tipCents)}</p>
          <section className="ps-ticket w-full" aria-label="Comprobante">
            <div className="ps-ticket-body">
              <div className="ps-ticket-head">
                <span className="ps-ticket-brand">COMPROBANTE</span>
                <span className="ps-ticket-meta">
                  {restaurant} · {tableName}
                  {when ? ` · ${when}` : ""}
                </span>
              </div>
              <div className="ps-ticket-rule" aria-hidden="true" />
              <div className="ps-ticket-line">
                <span>Tu parte</span>
                <span className="ps-ticket-amt">{formatMXN(session.amountCents)}</span>
              </div>
              <div className="ps-ticket-line">
                <span>Propina</span>
                <span className="ps-ticket-amt ps-tip-amt">{formatMXN(session.tipCents)}</span>
              </div>
              <div className="ps-ticket-line">
                <span>Método</span>
                <span className="ps-ticket-amt">{method}</span>
              </div>
            </div>
            <div className="ps-ticket-stub">
              <div className="ps-ticket-line ps-ticket-total">
                <span>Restante de la mesa</span>
                <span className="ps-ticket-amt">
                  {remainingCents === 0 ? "Cubierta" : formatMXN(remainingCents)}
                </span>
              </div>
            </div>
            <div className="ps-ticket-edge" aria-hidden="true" />
          </section>
        </div>
      </ScrollBody>
      <FooterBar tone="integrated">
        <Button variant="primary" onClick={onDone}>
          Listo
        </Button>
      </FooterBar>
    </DinerShell>
  );
}
