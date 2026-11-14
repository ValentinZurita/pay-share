import { describe, expect, it } from "vitest";
import { centsToPesos, formatMXN, parsePesosToCents, pesosMatchCents } from "@/lib/money";

describe("parsePesosToCents", () => {
  it("convierte pesos con centavos", () => {
    expect(parsePesosToCents("300.50")).toBe(30050);
    expect(parsePesosToCents("300.5")).toBe(30050);
    expect(parsePesosToCents("300")).toBe(30000);
    expect(parsePesosToCents("$300.50")).toBe(30050);
  });

  it("acepta coma de miles", () => {
    expect(parsePesosToCents("1,234.50")).toBe(123450);
    expect(parsePesosToCents("12,345")).toBe(1234500);
  });

  it("suma 0.1 y 0.2 sin perder un centavo", () => {
    expect(parsePesosToCents("0.1") + parsePesosToCents("0.2")).toBe(30);
    expect(parsePesosToCents("0.10") + parsePesosToCents("0.20")).toBe(30);
  });

  it("rechaza negativos, texto y más de dos decimales", () => {
    expect(() => parsePesosToCents("-1")).toThrow();
    expect(() => parsePesosToCents("abc")).toThrow();
    expect(() => parsePesosToCents("1.234")).toThrow();
    expect(() => parsePesosToCents("12,34")).toThrow();
    expect(() => parsePesosToCents("")).toThrow();
  });
});

describe("formatMXN", () => {
  it("formatea con dos decimales y coma de miles", () => {
    expect(formatMXN(30050)).toBe("$300.50");
    expect(formatMXN(123400)).toBe("$1,234.00");
    expect(formatMXN(1)).toBe("$0.01");
  });

  it("convierte centavos a pesos", () => {
    expect(centsToPesos(30050)).toBe(300.5);
    expect(pesosMatchCents(0.01, 1)).toBe(true);
    expect(pesosMatchCents(0.02, 1)).toBe(false);
  });
});
