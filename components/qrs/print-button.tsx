"use client";

import { Button } from "@/components/ui/button";

export function PrintButton() {
  return (
    <Button variant="secondary" size="compact" onClick={() => window.print()}>
      Imprimir
    </Button>
  );
}
