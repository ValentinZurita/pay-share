"use client";

import QRCode from "qrcode";
import { useEffect, useRef } from "react";

export function QrImage({ value, dim }: { value: string; dim?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const styles = getComputedStyle(document.documentElement);
    const dark = styles.getPropertyValue("--ink").trim() || "#0a2540";
    const light = styles.getPropertyValue("--surface").trim() || "#ffffff";
    void QRCode.toCanvas(canvas, value, {
      width: 188,
      margin: 1,
      color: { dark, light },
    });
  }, [value]);

  return (
    <div className={dim ? "card qr dim" : "card qr"}>
      <canvas ref={ref} width={188} height={188} aria-label="Código QR para pagar con CoDi" />
    </div>
  );
}

export async function qrPng(value: string): Promise<Blob> {
  const styles = getComputedStyle(document.documentElement);
  const dark = styles.getPropertyValue("--ink").trim();
  const light = styles.getPropertyValue("--surface").trim();
  const dataUrl = await QRCode.toDataURL(value, {
    width: 512,
    margin: 2,
    color: { dark, light },
  });
  const response = await fetch(dataUrl);
  return response.blob();
}
