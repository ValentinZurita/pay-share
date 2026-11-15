import { Suspense } from "react";
import { connection } from "next/server";
import QRCode from "qrcode";
import { PrintButton } from "@/components/qrs/print-button";
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
    <main className="qrs">
      <div className="qrs-bar no-print">
        <h1 className="h-page">{restaurant}</h1>
        <PrintButton />
      </div>
      <div className="qrs-grid">
        {cards.map((card) => (
          <article key={card.id} className="card qr-print">
            <p className="lbl">{restaurant}</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={card.image} alt={`Código para abrir ${card.name}`} />
            <strong>{card.name}</strong>
            <p>Escanea para pagar tu parte</p>
          </article>
        ))}
      </div>
    </main>
  );
}
