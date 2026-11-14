import { Suspense } from "react";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { MesaApp } from "@/components/mesa/mesa-app";
import { AccountSkeleton } from "@/components/ui/account-card";
import { getTableSnapshot } from "@/lib/db";
import { peyMode, restaurantName } from "@/lib/env";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<AccountSkeleton />}>
      <MesaPage params={params} />
    </Suspense>
  );
}

async function MesaPage({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  const tableId = Number(id);
  if (!Number.isInteger(tableId)) notFound();
  let snapshot;
  let name = "Pay Share";
  let mockMode = true;
  try {
    snapshot = await getTableSnapshot(tableId);
    name = restaurantName();
    mockMode = peyMode() === "mock";
  } catch (error) {
    const message = error instanceof Error ? error.message : "No pudimos conectar.";
    return (
      <div className="diner-col">
        <div className="body">
          <div className="center grow">
            <p className="title">Falta configuración</p>
            <p>{message}</p>
          </div>
        </div>
      </div>
    );
  }
  if (!snapshot) notFound();
  return <MesaApp initial={snapshot} restaurant={name} mockMode={mockMode} />;
}
