"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Card, KeyValueList } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { IconBack, IconCheck, IconPhone } from "@/components/ui/icons";
import { DinerShell, FooterBar, ScrollBody } from "@/components/ui/page-shell";
import { QrImage } from "@/components/ui/qr-image";
import { ShopBar } from "@/components/ui/shop-bar";
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
    <div className="flex flex-col gap-2 self-stretch rounded-lg border border-dashed border-line-strong px-3 py-2.5 text-center">
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
      <ShopBar
        restaurant={`Pagar ${total}`}
        subtitle={`${tableName} · cuenta ${billId}`}
        leading={
          <Button variant="surface" size="icon" aria-label="Cambiar monto" onClick={onBack}>
            <IconBack />
          </Button>
        }
      />

      {isQr && session.qrString ? (
        <ScrollBody>
          <div className="flex flex-col items-center gap-3 text-center">
            <QrImage value={session.qrString} dim={expired} />
            <StatusPill loading={!expired}>
              {expired ? "Este código venció" : `Esperando tu pago · vence en ${remainLabel}`}
            </StatusPill>
            <Card className="w-full">
              <ol className="m-0 list-none px-4 py-1 text-left">
                {QR_STEPS.map((step, index) => (
                  <li
                    key={step}
                    className={`flex items-center gap-3 py-[11px] text-[14px] text-ink ${
                      index > 0 ? "border-t border-line" : ""
                    }`}
                  >
                    <b className="grid h-[22px] w-[22px] flex-none place-items-center rounded-full bg-primary-tint text-[12px] font-semibold text-primary-press">
                      {index + 1}
                    </b>
                    {step}
                  </li>
                ))}
              </ol>
            </Card>
            {mockMode ? <SimulateBox paymentId={session.paymentId} /> : null}
          </div>
        </ScrollBody>
      ) : (
        <ScrollBody>
          <EmptyState
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
              <Button variant="secondary" onClick={onShareQr}>
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
export function PaymentDoneView({
  restaurant,
  tableName,
  session,
  remainingCents,
  onDone,
}: {
  restaurant: string;
  tableName: string;
  session: PaymentSession;
  remainingCents: number;
  onDone: () => void;
}) {
  return (
    <DinerShell>
      <ShopBar restaurant={restaurant} end={<Badge variant="neutral">{tableName}</Badge>} />
      <ScrollBody>
        <EmptyState
          tone="success"
          icon={<IconCheck />}
          title="Pago recibido"
        >
          <p className="m-0 text-[38px] font-bold leading-[1.1] tracking-[-0.035em] text-ink num">
            {formatMXN(session.amountCents + session.tipCents)}
          </p>
          <KeyValueList
            className="w-full text-left"
            items={[
              { label: "Tu parte", value: formatMXN(session.amountCents) },
              { label: "Propina", value: formatMXN(session.tipCents), accent: "warn" },
              {
                label: "Restante de la mesa",
                value: remainingCents === 0 ? "Cubierta" : formatMXN(remainingCents),
              },
            ]}
          />
        </EmptyState>
      </ScrollBody>
      <FooterBar tone="integrated">
        <Button variant="primary" onClick={onDone}>
          Listo
        </Button>
      </FooterBar>
    </DinerShell>
  );
}
