import type { Metadata } from "next";
import Image from "next/image";
import { formatDate } from "@/lib/calc";
import { infoFormulari } from "@/lib/formulari";
import { Formulari } from "./formulari";

export const metadata: Metadata = {
  title: { absolute: "Formulari diari · CE Europa" },
  robots: { index: false, follow: false },
};

export default async function PaginaFormulari({ params }: PageProps<"/f/[token]">) {
  const { token } = await params;
  const info = await infoFormulari(token);

  return (
    <main className="min-h-dvh bg-surface-2/60 pb-10">
      <div className="mx-auto max-w-lg px-4 pt-[calc(1.5rem+env(safe-area-inset-top))]">
        <header className="overflow-hidden rounded-3xl bg-surface shadow-sm ring-1 ring-border">
          <div className="stripes h-3 bg-brand" />
          <div className="flex items-center gap-3 p-5">
            <Image src="/escut.png" alt="CE Europa" width={56} height={56} className="h-14 w-14 shrink-0" />
            <div>
              <h1 className="display text-2xl leading-tight text-heading">Formulari diari</h1>
              <p className="text-sm text-muted">
                Readaptació CE Europa{info ? ` · ${formatDate(info.avui, { weekday: "long", day: "numeric", month: "long" })}` : ""}
              </p>
            </div>
          </div>
        </header>
        {info ? (
          <Formulari token={token} info={info} />
        ) : (
          <p className="mt-4 rounded-3xl bg-surface p-6 text-center text-sm text-muted ring-1 ring-border">Aquest formulari ja no és vàlid. Demana l&apos;enllaç nou al readaptador.</p>
        )}
      </div>
    </main>
  );
}
