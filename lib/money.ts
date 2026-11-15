const INVALID = "Escribe solo el monto, por ejemplo 300.";

/** Deja solo dígitos y un decimal. Las letras no entran. La coma suelta cuenta como punto. */
export function sanitizePesosInput(raw: string): string {
  const cleaned = raw.replace(/\$/g, "").replace(/\s/g, "").replace(/[^\d.,]/g, "");
  if (!cleaned) return "";

  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");
  let decimalAt = -1;
  if (lastComma >= 0 && lastDot >= 0) {
    decimalAt = Math.max(lastComma, lastDot);
  } else if (lastComma >= 0) {
    const commas = cleaned.split(",").length - 1;
    const after = cleaned.slice(lastComma + 1).replace(/[^\d]/g, "");
    if (commas === 1 && after.length <= 2) decimalAt = lastComma;
  } else if (lastDot >= 0) {
    decimalAt = lastDot;
  }

  const wholeRaw = (decimalAt >= 0 ? cleaned.slice(0, decimalAt) : cleaned).replace(/[^\d]/g, "");
  const fracRaw = decimalAt >= 0 ? cleaned.slice(decimalAt + 1).replace(/[^\d]/g, "") : "";
  const whole = wholeRaw.replace(/^0+(?=\d)/, "");
  const frac = fracRaw.slice(0, 2);
  const trailing = decimalAt >= 0 && fracRaw.length === 0 && /[.,]$/.test(cleaned);
  if (!whole && !frac && !trailing) return "";
  const pesos = whole || "0";
  if (trailing) return `${pesos}.`;
  if (decimalAt >= 0) return frac ? `${pesos}.${frac}` : pesos;
  return pesos;
}

/** Pesos con hasta 2 decimales y coma de miles → centavos enteros. */
export function parsePesosToCents(input: string): number {
  const cleaned = input.trim().replace(/^\$/, "").trim().replace(/[.,]$/, "");
  if (cleaned === "" || cleaned.startsWith("-")) {
    throw new Error(INVALID);
  }

  const withThousands = /^\d{1,3}(,\d{3})+(\.\d{1,2})?$/;
  const plain = /^\d+(\.\d{1,2})?$/;
  if (!withThousands.test(cleaned) && !plain.test(cleaned)) {
    throw new Error(INVALID);
  }

  const [whole, frac = ""] = cleaned.replace(/,/g, "").split(".");
  const cents = Number(whole) * 100 + Number(frac.padEnd(2, "0"));
  if (!Number.isSafeInteger(cents)) throw new Error(INVALID);
  return cents;
}

export function centsToPesos(cents: number): number {
  return cents / 100;
}

/** Siempre `$1,234.00`. */
export function formatMXN(cents: number): string {
  const negative = cents < 0;
  const abs = Math.abs(Math.trunc(cents));
  const pesos = Math.floor(abs / 100);
  const frac = String(abs % 100).padStart(2, "0");
  const grouped = pesos.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${negative ? "-" : ""}$${grouped}.${frac}`;
}

/** Compara un monto en pesos (como lo manda Pey) contra centavos, sin error de flotante. */
export function pesosMatchCents(pesos: number, cents: number): boolean {
  if (!Number.isFinite(pesos)) return false;
  return Math.round(pesos * 100) === cents;
}
