"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type Tone = "ok" | "info" | "error";
interface Avis {
  id: number;
  text: string;
  tone: Tone;
}

/** Mostra un avís flotant des de qualsevol component client. */
export function toast(text: string, tone: Tone = "ok") {
  window.dispatchEvent(new CustomEvent("ra-toast", { detail: { text, tone } }));
}

// Missatges que arriben per l'enllaç (?ok=...) després d'una acció que canvia de pàgina
const MISSATGES: Record<string, string> = {
  jugador: "Jugador desat",
  "jugador-eliminat": "Jugador eliminat",
  lesio: "Lesió desada",
  "lesio-eliminada": "Lesió eliminada",
  wellness: "Wellness desat",
  sessio: "Sessió creada",
  "sessio-plantilla": "Sessió creada amb la plantilla",
  "sessio-acabada": "Sessió acabada! Aquí tens la fitxa per al jugador",
  "sessio-eliminada": "Sessió eliminada",
  duplicada: "Sessió duplicada per avui",
  tractament: "Tractament desat",
  "tractament-eliminat": "Tractament eliminat",
  test: "Test desat",
  exercici: "Exercici desat",
  "pendent-enviar": "Desat al mòbil: s'enviarà quan hi hagi connexió",
};

let seq = 0;

/** Pila d'avisos flotants (a sobre de la barra inferior al mòbil). */
export function Toaster() {
  const [avisos, setAvisos] = useState<Avis[]>([]);
  const params = useSearchParams();
  const pathname = usePathname();

  useEffect(() => {
    const onToast = (e: Event) => {
      const { text, tone } = (e as CustomEvent<{ text: string; tone: Tone }>).detail;
      const id = ++seq;
      setAvisos((a) => [...a.slice(-2), { id, text, tone }]);
      setTimeout(() => setAvisos((a) => a.filter((x) => x.id !== id)), 2800);
    };
    window.addEventListener("ra-toast", onToast);
    return () => window.removeEventListener("ra-toast", onToast);
  }, []);

  // Avís que arriba per l'enllaç: es mostra i es treu el paràmetre de la URL
  useEffect(() => {
    const codi = params.get("ok");
    if (!codi) return;
    const text = MISSATGES[codi];
    if (text) toast(text);
    const url = new URL(window.location.href);
    url.searchParams.delete("ok");
    window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
  }, [params, pathname]);

  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-[60] flex flex-col items-center gap-2 px-4 sm:bottom-6 print:hidden">
      {avisos.map((a) => (
        <div
          key={a.id}
          role="status"
          className={`toast-entra display flex items-center gap-2 rounded-full px-5 py-3 text-sm shadow-[0_10px_30px_rgba(11,27,77,0.35)] ${
            a.tone === "error" ? "bg-danger text-white" : a.tone === "info" ? "bg-navy text-white" : "bg-navy text-white"
          }`}
        >
          <span aria-hidden className={a.tone === "error" ? "" : "text-[#e0b36e]"}>
            {a.tone === "error" ? "⚠" : a.tone === "info" ? "ℹ" : "✓"}
          </span>
          {a.text}
        </div>
      ))}
    </div>
  );
}
