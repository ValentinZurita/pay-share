function missing(name: string): never {
  throw new Error(
    `Falta la variable ${name}. Agrégala en .env.local (en local) o en las variables de entorno de Vercel (en producción). El ejemplo está en .env.example.`,
  );
}

function read(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) missing(name);
  return value;
}

export function supabaseUrl(): string {
  return read("NEXT_PUBLIC_SUPABASE_URL");
}

export function supabaseAnonKey(): string {
  return read("NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

export function supabaseServiceRoleKey(): string {
  return read("SUPABASE_SERVICE_ROLE_KEY");
}

export function baseUrl(): string {
  return read("NEXT_PUBLIC_BASE_URL").replace(/\/$/, "");
}

export function restaurantName(): string {
  return read("NEXT_PUBLIC_RESTAURANT_NAME");
}

/** Activo salvo que valga exactamente "false". */
export function demoMode(): boolean {
  return process.env.DEMO_MODE !== "false";
}

export function peyMode(): "mock" | "live" {
  const value = process.env.PEY_MODE?.trim() || "mock";
  if (value !== "mock" && value !== "live") {
    throw new Error(
      `PEY_MODE debe ser "mock" o "live". Ahora vale "${value}". Cámbiala en .env.local.`,
    );
  }
  return value;
}

export function peyApiKey(): string {
  return read("PEY_API_KEY");
}

export function peyWebhookSecret(): string {
  return read("PEY_WEBHOOK_SECRET");
}

/** Vacío si no está definido. En producción la caja no debe quedar abierta. */
export function cashierPin(): string | null {
  const value = process.env.CASHIER_PIN?.trim();
  return value ? value : null;
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}
