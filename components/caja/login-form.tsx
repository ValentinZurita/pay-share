"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, TextInput } from "@/components/ui/input";
import { LabelText } from "@/components/ui/text";

export function LoginForm({ restaurant, nextPath }: { restaurant: string; nextPath: string }) {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (sending) return;
    setSending(true);
    setError("");
    try {
      const response = await fetch("/api/caja/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(body.error ?? "PIN incorrecto.");
        return;
      }
      router.push(nextPath);
      router.refresh();
    } catch {
      setError("No pudimos conectar. Revisa tu internet e inténtalo de nuevo.");
    } finally {
      setSending(false);
    }
  }

  return (
    <Card className="p-6">
      <form onSubmit={(event) => void submit(event)} className="flex flex-col gap-4">
        <LabelText>{restaurant}</LabelText>
        <h1 className="m-0 text-[22px] font-bold tracking-[-0.03em] text-ink">Caja</h1>
        <Field label="PIN" htmlFor="pin" error={error || undefined}>
          <TextInput
            id="pin"
            type="password"
            inputMode="numeric"
            autoComplete="current-password"
            invalid={Boolean(error)}
            value={pin}
            autoFocus
            onChange={(event) => setPin(event.target.value)}
          />
        </Field>
        <Button variant="primary" type="submit" disabled={sending || pin.length === 0}>
          {sending ? "Entrando…" : "Entrar"}
        </Button>
      </form>
    </Card>
  );
}
