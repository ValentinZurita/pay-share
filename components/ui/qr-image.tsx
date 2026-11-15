"use client";

import QRCode from "qrcode";
import { useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
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
    const dark = styles.getPropertyValue("--ink").trim() || "#0a2540";
    const light = styles.getPropertyValue("--surface").trim() || "#ffffff";
    void QRCode.toCanvas(canvas, value, {
      width: 188,
      margin: 1,
      color: { dark, light },
    });
  }, [value]);

  return (
    <Card className={cn("p-4", dim && "opacity-35")}>
      <canvas ref={ref} width={188} height={188} className="block h-[188px] w-[188px]" aria-label={label} />
    </Card>
  );
}

/**
 * Generates a 512px PNG Blob for downloading or sharing a QR code.
 */
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
