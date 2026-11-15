import { describe, expect, it } from "vitest";
import { parseTheme, themeClass } from "@/lib/theme";

describe("parseTheme", () => {
  it("acepta light, auto y dark", () => {
    expect(parseTheme("light")).toBe("light");
    expect(parseTheme("auto")).toBe("auto");
    expect(parseTheme("dark")).toBe("dark");
  });

  it("cae a light si el valor es inválido", () => {
    expect(parseTheme("x")).toBe("light");
    expect(parseTheme("")).toBe("light");
  });

  it("cae a light si el valor es null", () => {
    expect(parseTheme(null)).toBe("light");
  });

  it("cae a light si el valor es un objeto raro", () => {
    expect(parseTheme({ mode: "dark" })).toBe("light");
  });
});

describe("themeClass", () => {
  it("arma la clase de cada tema", () => {
    expect(themeClass("light")).toBe("t-light");
    expect(themeClass("auto")).toBe("t-auto");
    expect(themeClass("dark")).toBe("t-dark");
  });
});
