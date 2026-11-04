"use client";

import { useTransition } from "react";
import { toast } from "@/components/toast";
import { Button } from "@/components/ui";
import { desaPlantilla } from "@/lib/actions";

/** Desa els exercicis de la sessió com a plantilla per reutilitzar-la amb altres jugadors. */
export function DesaPlantilla({ sessionId, nom }: { sessionId: string; nom: string }) {
  const [pending, start] = useTransition();
  return (
    <Button
      variant="secondary"
      disabled={pending}
      onClick={() => {
        const triat = window.prompt("Nom de la plantilla (p. ex. «LCA · Fase 2»)", nom);
        if (!triat?.trim()) return;
        start(async () => {
          const r = await desaPlantilla(sessionId, triat);
          if (r.error) toast(r.error, "error");
          else toast(`Plantilla «${triat.trim()}» desada`);
        });
      }}
    >
      {pending ? "Desant…" : "⭐ Plantilla"}
    </Button>
  );
}
