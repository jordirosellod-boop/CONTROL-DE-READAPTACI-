"use client";

import { useRef, useState } from "react";
import { toast } from "./toast";

const MAX_COSTAT = 1400;

/** Redueix la foto (les del mòbil fan uns quants MB) a un JPEG lleuger. */
async function redueix(fitxer: File): Promise<string> {
  const url = URL.createObjectURL(fitxer);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const escala = Math.min(1, MAX_COSTAT / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.naturalWidth * escala);
    canvas.height = Math.round(img.naturalHeight * escala);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas");
    ctx.fillStyle = "#fff"; // fons blanc per a PNG transparents
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.82);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Camp per afegir una imatge de l'exercici: fer una foto amb la càmera o triar-la
 * de la galeria. S'envia al servidor dins el formulari (camp `imatge_data`).
 */
export function ImatgeInput({ actual, label = "Imatge de l'exercici" }: { actual?: string | null; label?: string }) {
  const [nova, setNova] = useState<string | null>(null);
  const [treure, setTreure] = useState(false);
  const [processant, setProcessant] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const mostra = nova ?? (treure ? null : actual ?? null);

  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      <input type="hidden" name="imatge_data" value={nova ?? ""} />
      <input type="hidden" name="treure_imatge" value={treure && !nova ? "1" : ""} />
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="sr-only"
        aria-label={label}
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (!f) return;
          setProcessant(true);
          try {
            setNova(await redueix(f));
            setTreure(false);
          } catch {
            toast("No s'ha pogut llegir la imatge", "error");
          } finally {
            setProcessant(false);
          }
        }}
      />
      {mostra ? (
        <div className="relative overflow-hidden rounded-2xl border border-border bg-surface-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={mostra} alt="" className="mx-auto max-h-64 w-auto object-contain" />
          <div className="absolute right-2 bottom-2 flex gap-2">
            <button type="button" onClick={() => input.current?.click()} className="display rounded-full bg-navy/85 px-3 py-1.5 text-xs text-white backdrop-blur">
              Canviar
            </button>
            <button
              type="button"
              onClick={() => {
                setNova(null);
                setTreure(true);
              }}
              className="display rounded-full bg-danger/90 px-3 py-1.5 text-xs text-white backdrop-blur"
            >
              Treure
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={processant}
          className="flex w-full flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-border bg-surface-2/50 px-4 py-6 text-sm text-muted transition active:scale-[0.99]"
        >
          <span aria-hidden className="text-3xl">📷</span>
          <span className="display text-heading">{processant ? "Preparant…" : "Fer foto o triar imatge"}</span>
          <span className="text-xs">Des de la càmera o la galeria</span>
        </button>
      )}
    </div>
  );
}
