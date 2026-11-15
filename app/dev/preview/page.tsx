import { notFound } from "next/navigation";
import { BrandBar, cajaSubtitle } from "@/components/ui/brand-bar";

export default function PreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[440px] flex-col gap-8 bg-bg py-4">
      <section className="flex flex-col gap-3" aria-label="Comensal">
        <BrandBar subtitle="Paga con CoDi" chip="Mesa 4" />
        <p className="m-0 px-5 text-[15px] text-muted">Cuenta de muestra. Sin red.</p>
      </section>
      <section className="flex flex-col gap-3" aria-label="Caja">
        <BrandBar subtitle={cajaSubtitle("Casa Nopal")} chip="2 abiertas" showTheme={false} />
        <BrandBar subtitle={cajaSubtitle(null)} showTheme={false} />
      </section>
    </main>
  );
}
