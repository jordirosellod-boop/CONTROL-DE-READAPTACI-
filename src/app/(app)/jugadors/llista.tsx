"use client";

import Link from "next/link";
import { useState } from "react";
import { Avatar } from "@/components/avatar";
import { filtraJugadors } from "@/components/quick-actions";
import { Badge, cx } from "@/components/ui";

export interface FilaJugador {
  id: string;
  nom: string;
  cognoms: string;
  foto_url: string | null;
  dorsal: number | null;
  subtitol: string;
  lesio: string | null;
}

const FILTRES = [
  { key: "tots", label: "Tots" },
  { key: "lesionats", label: "Lesionats" },
  { key: "disponibles", label: "Disponibles" },
] as const;

/** Llista de jugadors amb cercador i filtre (com una app de contactes). */
export function LlistaJugadors({ files }: { files: FilaJugador[] }) {
  const [cerca, setCerca] = useState("");
  const [filtre, setFiltre] = useState<(typeof FILTRES)[number]["key"]>("tots");
  const llista = filtraJugadors(files, cerca).filter((f) => (filtre === "tots" ? true : filtre === "lesionats" ? f.lesio : !f.lesio));

  return (
    <div>
      <div className="sticky top-[calc(4rem+env(safe-area-inset-top))] z-10 -mx-4 mb-3 bg-background/90 px-4 py-2 backdrop-blur">
        <div className="relative">
          <span aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted">
            ⌕
          </span>
          <input type="search" value={cerca} onChange={(e) => setCerca(e.target.value)} placeholder="Busca per nom o dorsal" aria-label="Busca un jugador" className="input rounded-full pl-9" />
        </div>
        <div role="tablist" className="mt-2 inline-flex rounded-full bg-surface-2 p-1">
          {FILTRES.map((f) => (
            <button
              key={f.key}
              role="tab"
              aria-selected={filtre === f.key}
              onClick={() => setFiltre(f.key)}
              className={cx("display rounded-full px-3.5 py-1.5 text-xs transition", filtre === f.key ? "bg-surface text-heading shadow-sm" : "text-muted")}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
      {llista.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted">Cap jugador {cerca ? `amb «${cerca}»` : "en aquest filtre"}.</p>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
          {llista.map((p) => (
            <li key={p.id}>
              <Link href={`/jugadors/${p.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-surface-2 active:bg-surface-2">
                <Avatar nom={p.nom} cognoms={p.cognoms} foto={p.foto_url} dorsal={p.dorsal} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="font-medium">
                    {p.nom} {p.cognoms}
                  </div>
                  <div className="truncate text-sm text-muted">{p.subtitol}</div>
                  {p.lesio && <div className="mt-0.5 truncate text-xs font-medium text-warn">▲ {p.lesio}</div>}
                </div>
                {p.lesio ? <Badge tone="warn">Lesionat</Badge> : <Badge tone="ok">Disponible</Badge>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
