import { Suspense } from "react";
import { connection } from "next/server";
import { CajaApp } from "@/components/caja/caja-app";
import { AccountSkeleton } from "@/components/ui/account-card";
import { getAllSnapshots, isMemoryMode } from "@/lib/db";
import { restaurantName } from "@/lib/env";

export default function Page() {
  return (
    <Suspense fallback={<AccountSkeleton />}>
      <CajaPage />
    </Suspense>
  );
}

async function CajaPage() {
  await connection();
  let tables;
  let name = "Pay Share";
  let memory = false;
  try {
    tables = await getAllSnapshots();
    name = restaurantName();
    memory = isMemoryMode();
  } catch (error) {
    const message = error instanceof Error ? error.message : "No pudimos conectar.";
    return (
      <div className="login">
        <div className="card">
          <h1>Falta configuración</h1>
          <p>{message}</p>
        </div>
      </div>
    );
  }
  return <CajaApp initial={tables} restaurant={name} memory={memory} />;
}
