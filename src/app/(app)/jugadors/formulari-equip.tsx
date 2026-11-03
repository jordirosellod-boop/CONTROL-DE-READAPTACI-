"use client";

import { useState, useSyncExternalStore, useTransition } from "react";
import { toast } from "@/components/toast";
import { Button } from "@/components/ui";
import { nouFormulari } from "@/lib/actions";

/** Enllaç del formulari diari: un sol enllaç per a tot l'equip (els jugadors trien el seu nom). */
export function FormulariEquip({ codi: inicial }: { codi: string }) {
  const [codi, setCodi] = useState(inicial);
  const [obert, setObert] = useState(false);
  const [pending, start] = useTransition();
  const origen = useSyncExternalStore(
    () => () => {},
    () => window.location.origin,
    () => "",
  );
  const url = `${origen}/f/${codi}`;
  const missatge = `Formulari diari de readaptació 💙\nCada matí: wellness. Després d'entrenar: RPE.\n${url}`;

  return (
    <section className="mb-4 rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-center gap-3">
        <span aria-hidden className="text-2xl">📝</span>
        <div className="min-w-0 flex-1">
          <p className="display text-lg leading-tight text-heading">Formulari per als jugadors</p>
          <p className="text-xs text-muted">Wellness i RPE. Un sol enllaç per a tothom, sense usuari ni app.</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setObert((o) => !o)} aria-expanded={obert}>
          {obert ? "Tancar" : "Enllaç"}
        </Button>
      </div>
      {obert && (
        <div className="mt-3">
          <p className="truncate rounded-xl bg-surface-2 px-3 py-2 font-mono text-xs">{url}</p>
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
                  await navigator.clipboard.writeText(url);
                  toast("Enllaç copiat", "info");
                } catch {
                  toast("No s'ha pogut copiar", "error");
                }
              }}
            >
              Copiar
            </Button>
            <a href={url} target="_blank" rel="noopener noreferrer" className="display inline-flex items-center px-2 text-sm text-accent underline">
              Obrir el formulari
            </a>
          </div>
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              start(async () => {
                if (!window.confirm("Crear un enllaç nou? L'actual deixarà de funcionar i l'hauràs de tornar a enviar.")) return;
                const r = await nouFormulari();
                if (!r.codi) return toast(r.error ?? "Error", "error");
                setCodi(r.codi);
                toast("Enllaç nou creat");
              })
            }
            className="mt-3 text-xs text-muted underline"
          >
            Canviar l&apos;enllaç (si s&apos;ha compartit on no tocava)
          </button>
        </div>
      )}
    </section>
  );
}
