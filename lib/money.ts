const INVALID = "Escribe solo el monto, por ejemplo 300.";

/** Pesos con hasta 2 decimales y coma de miles → centavos enteros. */
export function parsePesosToCents(input: string): number {
  const cleaned = input.trim().replace(/^\$/, "").trim();
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
