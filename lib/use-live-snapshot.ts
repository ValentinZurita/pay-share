"use client";

import { useCallback, useEffect, useState } from "react";
import { getBrowserClient } from "@/lib/supabase-browser";
import type { Snapshot } from "@/lib/types";

const OFFLINE = "No pudimos conectar. Revisa tu internet e inténtalo de nuevo.";

export function useLiveSnapshot(tableId: number | null, initial: Snapshot | Snapshot[] | null) {
  const [data, setData] = useState<Snapshot | Snapshot[] | null>(initial);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(initial == null);

  const reload = useCallback(async () => {
    try {
      const url = tableId == null ? "/api/tables" : `/api/tables/${tableId}`;
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) throw new Error(OFFLINE);
      setData((await response.json()) as Snapshot | Snapshot[]);
      setError(null);
    } catch {
      setError(OFFLINE);
    } finally {
      setLoading(false);
    }
  }, [tableId]);

  useEffect(() => {
    const client = getBrowserClient();
    if (!client) return;
    const channel = client
      .channel(tableId == null ? "pay-share-all" : `pay-share-${tableId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "bills" }, () => {
        void reload();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "payments" }, () => {
        void reload();
      })
      .subscribe();
    return () => {
      void client.removeChannel(channel);
    };
  }, [reload, tableId]);

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible") void reload();
    };
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("focus", refresh);
    const timer = window.setInterval(refresh, 4000);
    return () => {
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("focus", refresh);
      window.clearInterval(timer);
    };
  }, [reload]);

  return { data, error, loading, reload };
}
