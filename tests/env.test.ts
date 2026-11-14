import { afterEach, describe, expect, it } from "vitest";
import { demoMode, peyMode, restaurantName } from "@/lib/env";

afterEach(() => {
  delete process.env.DEMO_MODE;
  delete process.env.PEY_MODE;
  delete process.env.NEXT_PUBLIC_RESTAURANT_NAME;
});

describe("env", () => {
  it("el modo demo está activo salvo false", () => {
    delete process.env.DEMO_MODE;
    expect(demoMode()).toBe(true);
    process.env.DEMO_MODE = "true";
    expect(demoMode()).toBe(true);
    process.env.DEMO_MODE = "false";
    expect(demoMode()).toBe(false);
  });

  it("PEY_MODE solo acepta mock o live", () => {
    delete process.env.PEY_MODE;
    expect(peyMode()).toBe("mock");
    process.env.PEY_MODE = "live";
    expect(peyMode()).toBe("live");
    process.env.PEY_MODE = "otro";
    expect(() => peyMode()).toThrow(/PEY_MODE/);
  });

  it("dice qué variable falta y dónde ponerla", () => {
    expect(() => restaurantName()).toThrow(/NEXT_PUBLIC_RESTAURANT_NAME/);
    expect(() => restaurantName()).toThrow(/\.env\.local/);
  });
});
