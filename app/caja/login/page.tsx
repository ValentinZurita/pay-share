import { Suspense } from "react";
import { connection } from "next/server";
import { LoginForm } from "@/components/caja/login-form";
import { cashierPin, isProduction, restaurantName } from "@/lib/env";

export default function Page({
  searchParams,
}: {
  searchParams: Promise<{ config?: string; next?: string }>;
}) {
  return (
    <Suspense fallback={null}>
      <LoginPage searchParams={searchParams} />
    </Suspense>
  );
}

async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ config?: string; next?: string }>;
}) {
  await connection();
  const query = await searchParams;
  const pin = cashierPin();
  const misconfigured = query.config === "1" || (isProduction() && !pin);
  let restaurant = "Pay Share";
  try {
    restaurant = restaurantName();
  } catch {
    restaurant = "Pay Share";
  }
  const nextPath = query.next === "/qrs" || query.next?.startsWith("/caja") ? query.next : "/caja";

  return (
    <div className="login">
      {misconfigured ? (
        <div className="card">
          <h1>Falta configuración</h1>
          <p>Define CASHIER_PIN en las variables de entorno del servidor. Sin ese PIN la caja no se abre.</p>
        </div>
      ) : (
        <LoginForm restaurant={restaurant} nextPath={nextPath} />
      )}
    </div>
  );
}
