import { Suspense } from "react";
import { connection } from "next/server";
import { CajaApp } from "@/components/caja/caja-app";
import { AccountSkeleton } from "@/components/ui/ticket";
import { Card } from "@/components/ui/card";
import { CenteredCardShell } from "@/components/ui/page-shell";
import { getAllSnapshots } from "@/lib/db";

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
  try {
    tables = await getAllSnapshots();
  } catch (error) {
    const message = error instanceof Error ? error.message : "No pudimos conectar.";
    return (
      <CenteredCardShell>
        <Card className="flex flex-col gap-4 p-6">
          <h1 className="m-0 text-[22px] font-bold tracking-[-0.03em] text-ink">
            Falta configuración
          </h1>
          <p className="m-0">{message}</p>
        </Card>
      </CenteredCardShell>
    );
  }
  return <CajaApp initial={tables} />;
}
