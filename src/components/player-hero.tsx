"use client";

import { useEffect, useRef, useState } from "react";
import { FASES } from "@/lib/constants";

/**
 * Capçalera de la fitxa en forma de "cromo" del club: foto retallada a la dreta,
 * dorsal gegant de fons i nom amb la tipografia del club.
 */
export function PlayerHero({
  nom,
  cognoms,
  foto,
  dorsal,
  linia,
  fase,
  setmana,
  arxivat,
}: {
  nom: string;
  cognoms: string;
  foto: string | null;
  dorsal: number | null;
  linia: string;
  fase: number | null;
  setmana: number | null;
  arxivat: boolean;
}) {
  const [carregada, setCarregada] = useState(false);
  const img = useRef<HTMLImageElement>(null);
  useEffect(() => {
    if (img.current?.complete && img.current.naturalWidth > 0) setCarregada(true);
  }, [foto]);
  const inicials = `${nom.trim()[0] ?? ""}${cognoms.trim()[0] ?? ""}`.toUpperCase();
  const f = fase ? FASES[fase - 1] : null;

  return (
    <section className="stripes relative mb-4 h-52 overflow-hidden rounded-3xl bg-brand text-white shadow-[0_12px_30px_rgba(11,27,77,0.35)] sm:h-60">
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(120%_90%_at_100%_100%,rgba(11,27,77,0.85),transparent_60%)]" />
      {/* Dorsal gegant de fons */}
      <span aria-hidden className="display pointer-events-none absolute -top-6 right-2 text-[11rem] leading-none text-white/10 sm:text-[14rem]">
        {dorsal ?? inicials}
      </span>

      {/* Foto retallada (s'esvaeix cap a l'esquerra perquè el text es llegeixi) */}
      {foto && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={img}
          src={foto}
          alt=""
          referrerPolicy="no-referrer"
          onLoad={() => setCarregada(true)}
          className={`absolute right-0 bottom-0 h-[115%] w-auto max-w-[62%] object-cover object-top transition-opacity duration-500 [mask-image:linear-gradient(to_right,transparent,black_35%)] ${carregada ? "opacity-100" : "opacity-0"}`}
        />
      )}
      {(!foto || !carregada) && (
        <span aria-hidden className="display absolute right-6 bottom-6 grid h-24 w-24 place-items-center rounded-full bg-white/10 text-4xl ring-2 ring-[#e0b36e]/70 sm:h-28 sm:w-28">
          {inicials}
        </span>
      )}

      <div className="relative flex h-full max-w-[62%] flex-col justify-end p-5">
        {dorsal != null && <span className="display text-3xl leading-none text-[#e0b36e]">#{dorsal}</span>}
        <h1 className="display mt-1 text-4xl leading-[0.9] drop-shadow sm:text-5xl">
          {nom}
          <br />
          {cognoms}
        </h1>
        <p className="mt-1.5 truncate text-sm text-white/80">{linia}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {arxivat && <span className="display rounded-full bg-white/15 px-2.5 py-1 text-xs">Arxivat</span>}
          {f && <span className="display rounded-full bg-[#e0b36e] px-2.5 py-1 text-xs text-navy">Fase {f.n} · {f.curt}</span>}
          {setmana != null && <span className="display rounded-full bg-white/15 px-2.5 py-1 text-xs backdrop-blur">Setmana {setmana}</span>}
        </div>
      </div>
    </section>
  );
}
