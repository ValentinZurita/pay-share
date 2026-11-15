import { Suspense } from "react";
import { connection } from "next/server";
import { LoginForm } from "@/components/caja/login-form";
import { BrandBar, cajaSubtitle } from "@/components/ui/brand-bar";
import { Card } from "@/components/ui/card";
import { DinerShell, ScrollBody } from "@/components/ui/page-shell";
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
  let restaurant = "";
  try {
    restaurant = restaurantName();
  } catch {
    restaurant = "";
  }
  const nextPath = query.next === "/qrs" || query.next?.startsWith("/caja") ? query.next : "/caja";

  return (
    <DinerShell>
      <BrandBar subtitle={cajaSubtitle(restaurant)} />
      <ScrollBody className="justify-center">
        {misconfigured ? (
          <Card className="flex flex-col gap-4 p-6">
            <h1 className="m-0 text-[22px] font-bold tracking-[-0.03em] text-ink">
              Falta configuración
            </h1>
            <p className="m-0">
              Define CASHIER_PIN en las variables de entorno del servidor. Sin ese PIN la caja no se
              abre.
            </p>
          </Card>
        ) : (
          <LoginForm restaurant={restaurant || "PayShare"} nextPath={nextPath} />
        )}
      </ScrollBody>
    </DinerShell>
  );
}
