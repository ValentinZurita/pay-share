"use client";

import { Suspense, useState } from "react";
import { notFound, useSearchParams } from "next/navigation";
import { assess } from "@/components/mesa/mesa-app";
import { PaymentForm } from "@/components/mesa/payment-form";
import { PaymentMethodSheet, PhoneChargeSheet } from "@/components/mesa/payment-sheets";
import { ActivePaymentView, PaymentDoneView, type PaymentSession } from "@/components/mesa/payment-views";
import type { TipMode } from "@/components/mesa/tip-selector";
import { BrandBar, cajaSubtitle } from "@/components/ui/brand-bar";
import { Badge } from "@/components/ui/badge";
import { Banner } from "@/components/ui/banner";
import { BottomSheet, SheetCancel } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Card, KeyValueList } from "@/components/ui/card";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { IconCheck, IconLock, IconMore, IconReceipt } from "@/components/ui/icons";
import { CurrencyInput, Field, TextInput } from "@/components/ui/input";
import { DinerShell, FooterBar, ScrollBody } from "@/components/ui/page-shell";
import { StatusPill } from "@/components/ui/status-pill";
import { ErrorText, LabelText, MutedNote, PageTitle } from "@/components/ui/text";
import { Ticket } from "@/components/ui/ticket";
import { formatMXN } from "@/lib/money";
import type { Snapshot, SnapshotPayment } from "@/lib/types";

const PREVIEW_OPENED_AT = "2026-11-14T18:30:00.000Z";

function previewPay(
  partial: Pick<SnapshotPayment, "id" | "name" | "amountCents" | "tipCents" | "status"> & {
    paidAt?: string | null;
  },
): SnapshotPayment {
  return {
    method: "qr",
    expired: false,
    createdAt: PREVIEW_OPENED_AT,
    paidAt: null,
    ...partial,
  };
}

const previewPayments: SnapshotPayment[] = [
  previewPay({ id: 1, name: "Ana", amountCents: 46000, tipCents: 4600, status: "paid", paidAt: "2026-11-15T03:12:00.000Z" }),
  previewPay({ id: 2, name: "Luis", amountCents: 46000, tipCents: 6900, status: "paid", paidAt: "2026-11-15T03:14:00.000Z" }),
  previewPay({ id: 3, name: null, amountCents: 30000, tipCents: 0, status: "paid", paidAt: "2026-11-15T03:19:00.000Z" }),
];

function previewBill(totalCents: number, payments: SnapshotPayment[], id = 12): NonNullable<Snapshot["bill"]> {
  const paidCents = payments.reduce((sum, payment) => (payment.status === "paid" ? sum + payment.amountCents : sum), 0);
  return {
    id,
    totalCents,
    status: "open",
    createdAt: PREVIEW_OPENED_AT,
    paidCents,
    tipsCents: 0,
    remainingCents: Math.max(0, totalCents - paidCents),
    overpaidCents: Math.max(0, paidCents - totalCents),
    payments,
  };
}

const PREVIEW_QR = "codi-preview-payshare";

function TicketPreview() {
  return (
    <DinerShell>
      <BrandBar subtitle="Paga con CoDi" chip="Mesa 4" />
      <ScrollBody>
        <Ticket
          restaurant="Casa Nopal"
          tableName="Mesa 4"
          createdAt={PREVIEW_OPENED_AT}
          bill={previewBill(184000, previewPayments)}
          pending={{ name: "Ana", partCents: 31000, tipCents: 3100 }}
        />
        <Ticket restaurant="Casa Nopal" tableName="Mesa 6" createdAt={PREVIEW_OPENED_AT} bill={previewBill(184000, [], 13)} />
        <Ticket
          restaurant="Casa Nopal"
          tableName="Mesa 2"
          createdAt={PREVIEW_OPENED_AT}
          bill={previewBill(184000, [previewPay({ id: 9, name: "Ana", amountCents: 184000, tipCents: 0, status: "paid", paidAt: "2026-11-15T03:40:00.000Z" })], 9)}
        />
        <Ticket restaurant="Casa Nopal" tableName="Mesa 4" createdAt={PREVIEW_OPENED_AT} staff bill={previewBill(184000, previewPayments)} />
      </ScrollBody>
    </DinerShell>
  );
}

function PayPreview({ initialSheet }: { initialSheet: "method" | "phone" | null }) {
  const bill = previewBill(184000, previewPayments);
  const [name, setName] = useState("Ana");
  const [amount, setAmount] = useState("310");
  const [tipMode, setTipMode] = useState<TipMode>("10");
  const [tipCustom, setTipCustom] = useState("");
  const [phone, setPhone] = useState("5512345678");
  const [sheet, setSheet] = useState(initialSheet);
  const quote = assess(amount, bill.remainingCents, tipMode, tipCustom);

  return (
    <DinerShell>
      <BrandBar subtitle="Paga con CoDi" chip="Mesa 4" />
      <ScrollBody>
        <Ticket
          bill={bill}
          restaurant="Casa Nopal"
          tableName="Mesa 4"
          createdAt={PREVIEW_OPENED_AT}
          pending={{ name, partCents: quote.part, tipCents: quote.tip }}
        />
        <PaymentForm
          amount={amount}
          tipMode={tipMode}
          tipCustom={tipCustom}
          tipCents={quote.tip}
          name={name}
          error={quote.error}
          remainingLabel={formatMXN(bill.remainingCents)}
          shareLabel={
            quote.ok && bill.totalCents > 0
              ? `Tu parte es el ${Math.round((quote.part / bill.totalCents) * 100)}% de la cuenta`
              : ""
          }
          onAmountChange={setAmount}
          onPayRemaining={() => setAmount((bill.remainingCents / 100).toFixed(2))}
          onTipModeChange={setTipMode}
          onTipCustomChange={setTipCustom}
          onNameChange={(value) => setName(value.slice(0, 40))}
        />
      </ScrollBody>
      <FooterBar>
        <Button variant="primary" disabled={!quote.ok} iconEnd={<IconLock />}>
          {quote.ok ? `Pagar ${formatMXN(quote.sum)}` : "Pagar"}
        </Button>
        <p className="m-0 text-center text-[12.5px] text-fg3">Pagas desde la app de tu banco. Sin comisión.</p>
      </FooterBar>
      {sheet === "method" ? (
        <PaymentMethodSheet
          totalCents={quote.sum}
          sending={false}
          onClose={() => setSheet(null)}
          onSelectPhone={() => setSheet("phone")}
          onSelectQr={() => setSheet(null)}
        />
      ) : null}
      {sheet === "phone" ? (
        <PhoneChargeSheet
          phone={phone}
          totalCents={quote.sum}
          error=""
          sending={false}
          onPhoneChange={setPhone}
          onSubmit={() => setSheet(null)}
          onClose={() => setSheet(null)}
        />
      ) : null}
    </DinerShell>
  );
}

function WaitPreview({ kind }: { kind: "qr" | "pn" }) {
  const session: PaymentSession = {
    paymentId: 1,
    method: kind,
    qrString: kind === "qr" ? PREVIEW_QR : undefined,
    expiresAt: "2026-11-15T22:00:00.000Z",
    amountCents: 31000,
    tipCents: 3100,
    phoneLast4: "4567",
  };
  return (
    <ActivePaymentView
      session={session}
      tableName="Mesa 4"
      billId={12}
      expired={false}
      remainLabel="14:32"
      saved={false}
      canShare={kind === "qr"}
      sending={false}
      connectionError={false}
      mockMode
      onBack={() => undefined}
      onRegenerateQr={() => undefined}
      onSaveQr={() => undefined}
      onShareQr={() => undefined}
      onSwitchToQr={() => undefined}
    />
  );
}

function DonePreview() {
  const session: PaymentSession = {
    paymentId: 1,
    method: "qr",
    expiresAt: "2026-11-15T22:00:00.000Z",
    amountCents: 31000,
    tipCents: 3100,
  };
  return (
    <PaymentDoneView
      tableName="Mesa 4"
      restaurant="Casa Nopal"
      session={session}
      remainingCents={31000}
      paidAt="2026-11-15T03:19:00.000Z"
      onDone={() => undefined}
    />
  );
}

function NoBillPreview() {
  return (
    <DinerShell>
      <BrandBar subtitle="Paga con CoDi" chip="Mesa 4" />
      <ScrollBody>
        <EmptyState icon={<IconReceipt />} title="Esta mesa no tiene cuenta abierta" description="Pídela a tu mesero." />
      </ScrollBody>
    </DinerShell>
  );
}

export default function PreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <Suspense fallback={null}>
      <PreviewRouter />
    </Suspense>
  );
}

function PreviewRouter() {
  const vista = useSearchParams().get("vista") ?? "primitivos";
  if (vista === "ticket") return <TicketPreview />;
  if (vista === "pago") return <PayPreview initialSheet={null} />;
  if (vista === "metodo") return <PayPreview initialSheet="method" />;
  if (vista === "celular") return <PayPreview initialSheet="phone" />;
  if (vista === "qr") return <WaitPreview kind="qr" />;
  if (vista === "espera-celular") return <WaitPreview kind="pn" />;
  if (vista === "pagado") return <DonePreview />;
  if (vista === "sin-cuenta") return <NoBillPreview />;
  return <PreviewGallery />;
}

function PreviewGallery() {
  const [sheet, setSheet] = useState(false);
  const [menuChoice, setMenuChoice] = useState("Claro");

  return (
    <DinerShell>
      <BrandBar subtitle="Paga con CoDi" chip="Mesa 4" />
      <ScrollBody>
        <PageTitle>Primitivos</PageTitle>
        <LabelText>Datos fijos. Sin red.</LabelText>

        <section className="flex flex-col gap-4" aria-label="Ticket">
          <LabelText>Ticket</LabelText>
          <Ticket
            restaurant="Casa Nopal"
            tableName="Mesa 4"
            createdAt={PREVIEW_OPENED_AT}
            bill={previewBill(184000, previewPayments)}
            pending={{ name: "Ana", partCents: 31000, tipCents: 3100 }}
          />
          <Ticket
            restaurant="Casa Nopal"
            tableName="Mesa 6"
            createdAt={PREVIEW_OPENED_AT}
            bill={previewBill(184000, [], 13)}
          />
          <Ticket
            restaurant="Casa Nopal"
            tableName="Mesa 2"
            createdAt={PREVIEW_OPENED_AT}
            bill={previewBill(184000, [previewPay({ id: 9, name: "Ana", amountCents: 184000, tipCents: 0, status: "paid", paidAt: "2026-11-15T03:40:00.000Z" })], 9)}
          />
          <Ticket
            restaurant="Casa Nopal"
            tableName="Mesa 4"
            createdAt={PREVIEW_OPENED_AT}
            staff
            bill={previewBill(184000, previewPayments)}
          />
        </section>

        <section className="flex flex-col gap-3" aria-label="Marca">
          <BrandBar subtitle={cajaSubtitle("Casa Nopal")} chip="2 abiertas" showTheme={false} />
          <BrandBar subtitle={cajaSubtitle(null)} showTheme={false} />
        </section>

        <section className="flex flex-col gap-2" aria-label="Botones">
          <LabelText>Botones</LabelText>
          <Button variant="primary">Pagar $330.00</Button>
          <Button variant="primary" disabled>
            Pagar
          </Button>
          <Button variant="secondary">Mejor usar código QR</Button>
          <Button variant="quiet">Cancelar</Button>
          <div className="flex items-center gap-2">
            <Button variant="surface" size="icon" aria-label="Superficie">
              <IconMore />
            </Button>
            <Button variant="ghost" size="icon-sm" aria-label="Fantasma">
              <IconMore />
            </Button>
            <Button variant="secondary" size="compact" fullWidth={false}>
              Compacto
            </Button>
          </div>
        </section>

        <section className="flex flex-col gap-3" aria-label="Campos">
          <Field label="Tu nombre" hint="(opcional)" htmlFor="preview-name">
            <TextInput id="preview-name" placeholder="Para que la mesa vea quién pagó" autoComplete="given-name" />
          </Field>
          <Field label="Monto" htmlFor="preview-amount" error="Solo faltan $200.00.">
            <CurrencyInput id="preview-amount" invalid defaultValue="300" />
          </Field>
        </section>

        <section className="flex flex-col gap-3" aria-label="Tarjetas">
          <Card className="p-4">
            <p className="m-0 text-fg">Tarjeta de vidrio</p>
          </Card>
          <Card variant="bordered" className="p-4">
            <p className="m-0">Tarjeta sólida</p>
          </Card>
          <Card variant="dashed" className="p-4">
            <p className="m-0 text-fg2">Tarjeta libre</p>
          </Card>
          <KeyValueList
            items={[
              { label: "Tu parte", value: "$300.00" },
              { label: "Propina", value: "$30.00", accent: "warn" },
            ]}
          />
        </section>

        <section className="flex flex-wrap gap-2" aria-label="Badges">
          <Badge variant="ok">Cubierta</Badge>
          <Badge variant="neutral">Libre</Badge>
          <Badge variant="info">Abierta</Badge>
          <Badge variant="warn">Propina</Badge>
        </section>

        <section className="flex flex-col gap-2" aria-label="Avisos">
          <Banner>No pudimos conectar. Revisa tu internet e inténtalo de nuevo.</Banner>
          <Banner variant="error">Este código venció.</Banner>
          <ErrorText>Escribe solo el monto, por ejemplo 300.</ErrorText>
          <Banner variant="info">El cobro llega a la app de tu banco.</Banner>
          <MutedNote>Nota secundaria de la mesa.</MutedNote>
        </section>

        <section className="flex flex-col items-start gap-2" aria-label="Estado">
          <StatusPill loading>Esperando tu pago · vence en 14:32</StatusPill>
          <StatusPill>Pago recibido</StatusPill>
        </section>

        <EmptyState
          grow={false}
          icon={<IconReceipt />}
          title="Esta mesa no tiene cuenta abierta"
          description="Pídela a tu mesero."
        />
        <EmptyState grow={false} tone="success" icon={<IconCheck />} title="Pago recibido" />

        <section className="flex items-center justify-between gap-3" aria-label="Menú">
          <LabelText>Menú</LabelText>
          <DropdownMenu
            label="Ejemplo de menú"
            items={["Claro", "Auto", "Oscuro"].map((label) => ({
              label,
              selected: label === menuChoice,
              onSelect: () => setMenuChoice(label),
            }))}
            trigger={({ open, toggle }) => (
              <Button variant="surface" size="compact" fullWidth={false} aria-expanded={open} onClick={toggle}>
                {menuChoice}
              </Button>
            )}
          />
        </section>

        <Button variant="secondary" onClick={() => setSheet(true)}>
          Abrir hoja
        </Button>
      </ScrollBody>
      <FooterBar>
        <Button variant="primary">Pagar $330.00</Button>
      </FooterBar>
      {sheet ? (
        <BottomSheet title="Hoja de muestra" onClose={() => setSheet(false)}>
          <Field label="Nota" htmlFor="preview-sheet">
            <TextInput id="preview-sheet" placeholder="Flota sobre el velo" />
          </Field>
          <SheetCancel />
        </BottomSheet>
      ) : null}
    </DinerShell>
  );
}
