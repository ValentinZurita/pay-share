"use client";

import type { ReactNode } from "react";
import { BottomSheet, SheetCancel } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { IconGo, IconPhone, IconQr } from "@/components/ui/icons";
import { Field, TextInput } from "@/components/ui/input";
import { formatMXN } from "@/lib/money";

function MethodOption({
  icon,
  title,
  subtitle,
  disabled,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex min-h-16 w-full items-center gap-3 rounded-lg bg-surface p-3.5 text-left shadow-card transition-shadow hover:shadow-card-hover disabled:opacity-60"
    >
      <span className="grid h-9 w-9 flex-none place-items-center rounded-lg bg-primary-tint text-primary">
        {icon}
      </span>
      <span>
        <b className="block text-[15px] font-semibold text-ink">{title}</b>
        <small className="text-[13px] text-muted">{subtitle}</small>
      </span>
      <span className="ml-auto text-muted">
        <IconGo />
      </span>
    </button>
  );
}

/**
 * Bottom sheet allowing the diner to choose between phone push or QR CoDi payment.
 */
export function PaymentMethodSheet({
  sending,
  onClose,
  onSelectPhone,
  onSelectQr,
}: {
  sending: boolean;
  onClose: () => void;
  onSelectPhone: () => void;
  onSelectQr: () => void;
}) {
  return (
    <BottomSheet title="¿Cómo quieres pagar?" onClose={onClose}>
      <MethodOption
        icon={<IconPhone />}
        title="Cobro a mi celular"
        subtitle="Te llega a la app de tu banco"
        onClick={onSelectPhone}
      />
      <MethodOption
        icon={<IconQr />}
        title="Código QR"
        subtitle="Para guardarlo o escanearlo"
        disabled={sending}
        onClick={onSelectQr}
      />
      <SheetCancel />
    </BottomSheet>
  );
}

/**
 * Bottom sheet for entering a 10-digit phone number to send a CoDi push charge.
 */
export function PhoneChargeSheet({
  phone,
  totalCents,
  error,
  sending,
  onPhoneChange,
  onSubmit,
  onClose,
}: {
  phone: string;
  totalCents: number;
  error: string;
  sending: boolean;
  onPhoneChange: (value: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}) {
  return (
    <BottomSheet title="¿A qué celular enviamos el cobro?" onClose={onClose}>
      <p className="m-0 text-[14px]">
        El que tienes registrado en tu banco. Solo lo usamos para este cobro y no lo guardamos.
      </p>
      <Field error={error || undefined}>
        <TextInput
          inputMode="numeric"
          autoComplete="tel-national"
          maxLength={10}
          placeholder="10 dígitos"
          aria-label="Celular a 10 dígitos"
          invalid={Boolean(error)}
          value={phone}
          onChange={(event) => onPhoneChange(event.target.value.replace(/\D/g, "").slice(0, 10))}
        />
      </Field>
      <Button
        variant="primary"
        type="button"
        disabled={!/^\d{10}$/.test(phone) || sending}
        onClick={onSubmit}
      >
        {sending ? "Enviando cobro…" : `Enviar cobro de ${formatMXN(totalCents)}`}
      </Button>
      <SheetCancel />
    </BottomSheet>
  );
}
