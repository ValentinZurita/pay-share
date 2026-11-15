"use client";

import { useState } from "react";
import { notFound } from "next/navigation";
import { BrandBar, cajaSubtitle } from "@/components/ui/brand-bar";
import { Badge } from "@/components/ui/badge";
import { Banner } from "@/components/ui/banner";
import { BottomSheet, SheetCancel } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Card, KeyValueList } from "@/components/ui/card";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { IconCheck, IconMore, IconReceipt } from "@/components/ui/icons";
import { CurrencyInput, Field, TextInput } from "@/components/ui/input";
import { DinerShell, FooterBar, ScrollBody } from "@/components/ui/page-shell";
import { StatusPill } from "@/components/ui/status-pill";
import { ErrorText, LabelText, MutedNote, PageTitle } from "@/components/ui/text";

export default function PreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();
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
