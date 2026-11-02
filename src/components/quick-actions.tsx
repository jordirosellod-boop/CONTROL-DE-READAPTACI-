"use client";

import Link from "next/link";
import { useState } from "react";
import type { JugadorLite } from "@/lib/data";
import { POSICIONS, labelOf } from "@/lib/constants";
import { normalitza } from "@/lib/plantilla";
import { Avatar } from "./avatar";
import { BottomSheet } from "./sheet";
import { cx } from "./ui";

const ACCIONS = [
  { key: "wellness", label: "Wellness", icona: "😊", ruta: (id: string) => `/jugadors/${id}/wellness` },
  { key: "sessio", label: "Sessió", icona: "🏃", ruta: (id: string) => `/jugadors/${id}/sessions/nova` },
  { key: "tractament", label: "Tractament", icona: "🤲", ruta: (id: string) => `/jugadors/${id}/tractaments/nou` },
  { key: "test", label: "Test", icona: "📏", ruta: (id: string) => `/jugadors/${id}/tests/nou` },
  { key: "fitxa", label: "Fitxa", icona: "🪪", ruta: (id: string) => `/jugadors/${id}` },
] as const;

/** Filtra jugadors pel que s'escriu (nom, cognoms o dorsal; sense accents). */
export function filtraJugadors<T extends { nom: string; cognoms: string; dorsal: number | null }>(llista: T[], text: string): T[] {
  const q = normalitza(text);
  if (!q) return llista;
  return llista.filter((j) => normalitza(`${j.nom} ${j.cognoms}`).includes(q) || String(j.dorsal ?? "") === q);
}

/** Botó "+" flotant amb accions ràpides: tria acció → busca jugador → hi vas. */
export function QuickActions({ jugadors }: { jugadors: JugadorLite[] }) {
  const [obert, setObert] = useState(false);
  const [accio, setAccio] = useState<(typeof ACCIONS)[number]>(ACCIONS[0]);
  const [cerca, setCerca] = useState("");
  const llista = filtraJugadors(jugadors, cerca);

  return (
    <>
      <button
        type="button"
        aria-label="Acció ràpida"
        onClick={() => setObert(true)}
        className="stripes fixed right-4 bottom-[calc(5.25rem+env(safe-area-inset-bottom))] z-40 grid h-14 w-14 place-items-center rounded-full bg-brand text-3xl leading-none text-white shadow-[0_8px_24px_rgba(10,46,160,0.45)] ring-4 ring-[#e0b36e]/40 transition active:scale-90 sm:right-8 sm:bottom-8 print:hidden"
      >
        +
      </button>
      <BottomSheet
        open={obert}
        onClose={() => {
          setObert(false);
          setCerca("");
        }}
        title="Acció ràpida"
      >
        <div className="mb-4 grid grid-cols-5 gap-1.5">
          {ACCIONS.map((a) => (
            <button
              key={a.key}
              type="button"
              onClick={() => setAccio(a)}
              aria-pressed={accio.key === a.key}
              className={cx(
                "flex flex-col items-center gap-1 rounded-2xl border-2 py-2.5 transition active:scale-95",
                accio.key === a.key ? "border-accent bg-accent-soft" : "border-transparent bg-surface-2",
              )}
            >
              <span aria-hidden className="text-2xl leading-none">
                {a.icona}
              </span>
              <span className="display text-[11px] text-heading">{a.label}</span>
            </button>
          ))}
        </div>
        <input
          type="search"
          value={cerca}
          onChange={(e) => setCerca(e.target.value)}
          placeholder="Busca un jugador (nom o dorsal)…"
          aria-label="Busca un jugador"
          className="input mb-2"
        />
        {jugadors.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">
            Encara no hi ha jugadors.{" "}
            <Link href="/jugadors/nou" className="font-medium text-accent underline" onClick={() => setObert(false)}>
              Crea&apos;n un
            </Link>
          </p>
        ) : llista.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">Cap jugador amb «{cerca}».</p>
        ) : (
          <ul className="divide-y divide-border">
            {llista.map((j) => (
              <li key={j.id}>
                <Link href={accio.ruta(j.id)} onClick={() => setObert(false)} className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-2.5 active:bg-surface-2">
                  <Avatar nom={j.nom} cognoms={j.cognoms} foto={j.foto_url} dorsal={j.dorsal} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">
                      {j.nom} {j.cognoms}
                    </span>
                    <span className="block truncate text-xs text-muted">{[j.equip, j.posicio ? labelOf(POSICIONS, j.posicio) : null].filter(Boolean).join(" · ")}</span>
                  </span>
                  <span className="display text-xs text-accent">
                    {accio.label} ›
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </BottomSheet>
    </>
  );
}
