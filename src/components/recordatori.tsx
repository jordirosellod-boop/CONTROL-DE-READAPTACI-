"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { Avatar } from "./avatar";

interface Pendent {
  id: string;
  nom: string;
  cognoms: string;
  foto_url: string | null;
  dorsal: number | null;
}

/** Jugadors lesionats que encara no han fet el wellness avui, amb recordatori per WhatsApp. */
export function RecordatoriWellness({ pendents, codi }: { pendents: Pendent[]; codi: string | null }) {
  const origen = useSyncExternalStore(
    () => () => {},
    () => window.location.origin,
    () => "",
  );
  if (pendents.length === 0) return null;
  const noms = pendents.map((p) => p.nom).join(", ");
  const missatge = `Bon dia! 👋 Encara falta el wellness d'avui de: ${noms}.${codi ? `\nEl podeu fer aquí (30 segons): ${origen}/f/${codi}` : ""}`;

  return (
    <section className="mb-6 rounded-2xl border-2 border-warn/40 bg-warn/8 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="display text-lg leading-tight text-heading">Falta el wellness d&apos;avui</p>
          <p className="text-xs text-muted">
            {pendents.length} {pendents.length === 1 ? "jugador encara no l'ha fet" : "jugadors encara no l'han fet"}
          </p>
        </div>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(missatge)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="display inline-flex items-center gap-1.5 rounded-full bg-[#25d366] px-4 py-2 text-sm text-white transition active:scale-[0.97]"
        >
          Recordar per WhatsApp
        </a>
      </div>
      <ul className="mt-3 flex flex-wrap gap-2">
        {pendents.map((p) => (
          <li key={p.id}>
            <Link href={`/jugadors/${p.id}`} className="flex items-center gap-2 rounded-full bg-surface py-1 pr-3 pl-1 text-sm shadow-sm ring-1 ring-border">
              <Avatar nom={p.nom} cognoms={p.cognoms} foto={p.foto_url} dorsal={null} size="sm" />
              {p.nom} {p.cognoms}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
