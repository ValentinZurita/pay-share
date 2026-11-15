import { Suspense } from "react";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { MesaApp } from "@/components/mesa/mesa-app";
import { AccountSkeleton } from "@/components/ui/account-card";
import { EmptyState } from "@/components/ui/empty-state";
import { DinerShell, ScrollBody } from "@/components/ui/page-shell";
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
      <DinerShell>
        <ScrollBody>
          <EmptyState title="Falta configuración" description={message} />
        </ScrollBody>
      </DinerShell>
    );
  }
  if (!snapshot) notFound();
  return <MesaApp initial={snapshot} restaurant={name} mockMode={mockMode} />;
}
