"use client";

export function PrintButton() {
  return (
    <button className="btn secondary" type="button" style={{ width: "auto", padding: "0 16px" }} onClick={() => window.print()}>
      Imprimir
    </button>
  );
}
