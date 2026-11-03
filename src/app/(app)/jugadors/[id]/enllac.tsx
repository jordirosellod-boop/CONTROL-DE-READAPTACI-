"use client";

import { useState, useSyncExternalStore, useTransition } from "react";
import { toast } from "@/components/toast";
import { Button, Card } from "@/components/ui";
import { generaEnllac, treuEnllac } from "@/lib/actions";

/** Enllaç personal perquè el jugador faci el wellness i l'RPE des del seu mòbil. */
export function EnllacJugador({ playerId, nom, enllac: inicial }: { playerId: string; nom: string; enllac: string | null }) {
  const [enllac, setEnllac] = useState(inicial);
  const [pending, start] = useTransition();
  const origen = useSyncExternalStore(
    () => () => {},
    () => window.location.origin,
    () => "",
  );
  const url = enllac ? `${origen}/j/${enllac}` : null;
  const missatge = url
    ? `Hola ${nom}! 💙 Aquest és el teu enllaç per fer el wellness cada matí i dir-nos com de dura ha estat la sessió. Guarda'l (o afegeix-lo a la pantalla d'inici): ${url}`
    : "";

  const crea = (confirmar: boolean) =>
    start(async () => {
      if (confirmar && !window.confirm("L'enllaç antic deixarà de funcionar. Vols crear-ne un de nou?")) return;
      const r = await generaEnllac(playerId);
      if (r.error || !r.enllac) return toast(r.error ?? "Error", "error");
      setEnllac(r.enllac);
      toast(confirmar ? "Enllaç nou creat" : "Enllaç creat");
    });

  return (
    <Card title="📲 Enllaç del jugador">
      <p className="text-sm text-muted">
        Amb aquest enllaç, {nom} pot fer el wellness i l&apos;RPE des del seu mòbil, sense contrasenya i sense veure res més de l&apos;app. Es desa directament aquí.
      </p>
      {!enllac ? (
        <Button onClick={() => crea(false)} disabled={pending} className="mt-3 w-full sm:w-auto">
          {pending ? "Creant…" : "Crear enllaç"}
        </Button>
      ) : (
        <>
          <p className="mt-3 truncate rounded-xl bg-surface-2 px-3 py-2 font-mono text-xs">{url}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(missatge)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="display inline-flex items-center justify-center rounded-full bg-[#25d366] px-5 py-2.5 text-sm text-white transition active:scale-[0.97]"
            >
              Enviar per WhatsApp
            </a>
            <Button
              variant="secondary"
              onClick={async () => {
                try {
                  if (navigator.share) await navigator.share({ title: "Wellness CE Europa", text: missatge });
                  else {
                    await navigator.clipboard.writeText(url!);
                    toast("Enllaç copiat", "info");
                  }
                } catch {
                  // cancel·lat
                }
              }}
            >
              Compartir / copiar
            </Button>
            <a href={url!} target="_blank" rel="noopener noreferrer" className="display inline-flex items-center px-3 text-sm text-accent underline">
              Veure com el veu
            </a>
          </div>
          <div className="mt-3 flex flex-wrap gap-3 text-xs">
            <button type="button" disabled={pending} onClick={() => crea(true)} className="text-muted underline">
              Canviar l&apos;enllaç
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  if (!window.confirm("Desactivar l'enllaç? El jugador ja no podrà enviar res.")) return;
                  const r = await treuEnllac(playerId);
                  if (r.error) return toast(r.error, "error");
                  setEnllac(null);
                  toast("Enllaç desactivat", "info");
                })
              }
              className="text-danger underline"
            >
              Desactivar
            </button>
          </div>
        </>
      )}
    </Card>
  );
}
