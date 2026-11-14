"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
    <form className="card" onSubmit={(event) => void submit(event)}>
      <p className="lbl">{restaurant}</p>
      <h1>Caja</h1>
      <div className="field">
        <label htmlFor="pin">PIN</label>
        <div className={error ? "input bad" : "input"}>
          <input
            id="pin"
            type="password"
            inputMode="numeric"
            autoComplete="current-password"
            value={pin}
            autoFocus
            onChange={(event) => setPin(event.target.value)}
          />
        </div>
        {error ? (
          <p className="msg-err" role="alert">
            {error}
          </p>
        ) : null}
      </div>
      <button className="btn primary" type="submit" disabled={sending || pin.length === 0}>
        {sending ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
