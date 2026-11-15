import { Suspense } from "react";
import { connection } from "next/server";
import QRCode from "qrcode";
import { PrintButton } from "@/components/qrs/print-button";
import { Card } from "@/components/ui/card";
import { LabelText, PageTitle } from "@/components/ui/text";
import { getAllSnapshots } from "@/lib/db";
import { baseUrl, restaurantName } from "@/lib/env";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <QrsPage />
    </Suspense>
  );
}

async function QrsPage() {
  await connection();
  const tables = await getAllSnapshots();
  const origin = baseUrl();
  const restaurant = restaurantName();
  const cards = await Promise.all(
    tables.map(async (table) => {
      const url = `${origin}/mesa/${table.table.id}`;
      const image = await QRCode.toDataURL(url, { width: 440, margin: 1, errorCorrectionLevel: "M" });
      return { id: table.table.id, name: table.table.name, url, image };
    }),
  );

  return (
    <main className="qrs-print-root mx-auto flex max-w-[1100px] flex-col gap-4 px-5 pt-6 pb-12">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <PageTitle>{restaurant}</PageTitle>
        <PrintButton />
      </div>
      <div className="qrs-print-grid grid grid-cols-[repeat(auto-fill,minmax(min(240px,100%),1fr))] gap-4">
        {cards.map((card) => (
          <Card
            key={card.id}
            className="qr-print-card flex flex-col items-center gap-2 p-5 text-center break-inside-avoid"
          >
            <LabelText>{restaurant}</LabelText>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={card.image}
              alt={`Código para abrir ${card.name}`}
              className="aspect-square h-auto w-[min(220px,100%)]"
            />
            <strong className="text-[20px] text-ink">{card.name}</strong>
            <p className="m-0">Escanea para pagar tu parte</p>
          </Card>
        ))}
      </div>
    </main>
  );
}
