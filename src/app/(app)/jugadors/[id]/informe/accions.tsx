"use client";

import { useState } from "react";
import { Button } from "@/components/ui";

/** Botons de l'informe: desar en PDF (via imprimir) i compartir l'enllaç. */
export function InformeAccions({ titol }: { titol: string }) {
  const [copiat, setCopiat] = useState(false);
  return (
    <div className="flex flex-wrap gap-2 print:hidden">
      <Button onClick={() => window.print()}>Desar PDF / Imprimir</Button>
      <Button
        variant="secondary"
        onClick={async () => {
          const url = window.location.href;
          try {
            if (navigator.share) {
              await navigator.share({ title: titol, url });
              return;
            }
            await navigator.clipboard.writeText(url);
            setCopiat(true);
            setTimeout(() => setCopiat(false), 2500);
          } catch {
            // L'usuari ha cancel·lat compartir
          }
        }}
      >
        {copiat ? "Enllaç copiat ✓" : "Compartir"}
      </Button>
    </div>
  );
}
