"use client";

import { useEffect, useRef, useState } from "react";

const SIZES = { sm: "h-10 w-10 text-sm", md: "h-14 w-14 text-lg", lg: "h-20 w-20 text-2xl" };
const DORSAL = { sm: "h-4 min-w-4 text-[9px]", md: "h-5 min-w-5 text-[11px]", lg: "h-7 min-w-7 text-sm" };

/**
 * Foto del jugador (de la web del club) sobre les seves inicials amb els colors i
 * les ratlles de l'escut: si no hi ha foto o no carrega, es veuen les inicials.
 * El dorsal surt en una xapa daurada.
 */
export function Avatar({ nom, cognoms, foto, dorsal, size = "md" }: { nom: string; cognoms?: string | null; foto?: string | null; dorsal?: number | null; size?: "sm" | "md" | "lg" }) {
  // La foto només es mostra quan ha carregat del tot; mentrestant (o si falla) es veuen les inicials.
  const [carregada, setCarregada] = useState<string | null>(null);
  const img = useRef<HTMLImageElement>(null);
  // Si la imatge ja s'havia carregat abans que React s'activés, onLoad no arriba a saltar.
  useEffect(() => {
    if (foto && img.current?.complete && img.current.naturalWidth > 0) setCarregada(foto);
  }, [foto]);
  const inicials = `${nom.trim()[0] ?? ""}${(cognoms ?? "").trim()[0] ?? ""}`.toUpperCase();
  return (
    <span aria-hidden className="relative inline-block shrink-0">
      <span className={`stripes display relative grid place-items-center overflow-hidden rounded-full bg-brand text-brand-fg ring-2 ring-[#e0b36e]/80 ${SIZES[size]}`}>
        {inicials || "?"}
        {foto && (
          // Imatge externa (ceeuropa.cat): <img> simple, sense optimització de Next.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={foto}
            ref={img}
            src={foto}
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
            onLoad={() => setCarregada(foto)}
            className={`absolute inset-0 h-full w-full bg-surface object-cover object-[50%_18%] transition-opacity duration-300 ${carregada === foto ? "opacity-100" : "opacity-0"}`}
          />
        )}
      </span>
      {dorsal != null && (
        <span className={`display absolute -right-1 -bottom-1 grid place-items-center rounded-full bg-[#e0b36e] px-1 leading-none text-navy ring-2 ring-surface ${DORSAL[size]}`}>{dorsal}</span>
      )}
    </span>
  );
}
