"use client";

import QRCode from "qrcode";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";

/**
 * Renders a QR code canvas inside a padded card, dimmed when expired.
 */
export function QrImage({
  value,
  dim,
  label = "Código QR para pagar con CoDi",
}: {
  value: string;
  dim?: boolean;
  label?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const styles = getComputedStyle(document.documentElement);
    const dark = styles.getPropertyValue("--qr-ink").trim() || "#111113";
    const light = styles.getPropertyValue("--qr-paper").trim() || "#ffffff";
    void QRCode.toCanvas(canvas, value, {
      width: 203,
      margin: 1,
      color: { dark, light },
    });
  }, [value]);

  return (
    <div className={cn("ps-qr-plate", dim && "opacity-35")}>
      <canvas ref={ref} width={203} height={203} role="img" aria-label={label} />
    </div>
  );
}

/**
 * Generates a 512px PNG Blob for downloading or sharing a QR code.
 */
export async function qrPng(value: string): Promise<Blob> {
  const styles = getComputedStyle(document.documentElement);
  const dark = styles.getPropertyValue("--qr-ink").trim() || "#111113";
  const light = styles.getPropertyValue("--qr-paper").trim() || "#ffffff";
  const dataUrl = await QRCode.toDataURL(value, {
    width: 512,
    margin: 2,
    color: { dark, light },
  });
  const response = await fetch(dataUrl);
  return response.blob();
}
