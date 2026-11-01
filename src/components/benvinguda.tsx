"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const CLAU = "ra-benvinguda";
const DURADA_MS = 3800;

/** Bon dia / Bona tarda / Bona nit segons l'hora de Barcelona. */
function salutacio(now = new Date()) {
  const h = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, timeZone: "Europe/Madrid" }).format(now));
  if (h >= 6 && h < 14) return "Bon dia";
  if (h >= 14 && h < 21) return "Bona tarda";
  return "Bona nit";
}

/**
 * Pantalla de benvinguda en obrir l'app: foto de qui entra de fons, salutació i
 * resum. Surt un cop per sessió i es tanca sola o tocant-la.
 */
export function Benvinguda({ nom, foto, enReadaptacio }: { nom: string; foto: string | null; enReadaptacio: number }) {
  const [visible, setVisible] = useState(false);
  const [sortint, setSortint] = useState(false);
  const [text, setText] = useState({ salutacio: "Hola", data: "" });

  useEffect(() => {
    let jaVista = false;
    try {
      jaVista = sessionStorage.getItem(CLAU) === "1";
      sessionStorage.setItem(CLAU, "1");
    } catch {
      // Sense sessionStorage (mode privat): la mostrem igualment
    }
    if (jaVista) return;
    // Text calculat al client: depèn de l'hora del dispositiu.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setText({
      salutacio: salutacio(),
      data: new Intl.DateTimeFormat("ca-ES", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Madrid" }).format(new Date()),
    });
    setVisible(true);
    const t1 = setTimeout(() => setSortint(true), DURADA_MS);
    const t2 = setTimeout(() => setVisible(false), DURADA_MS + 600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  if (!visible) return null;

  const tancar = () => {
    setSortint(true);
    setTimeout(() => setVisible(false), 500);
  };

  return (
    <div
      role="dialog"
      aria-label={`${text.salutacio}, ${nom}`}
      onClick={tancar}
      className={`benvinguda fixed inset-0 z-50 cursor-pointer overflow-hidden bg-navy text-white transition-opacity duration-500 ${sortint ? "opacity-0" : "opacity-100"}`}
    >
      {foto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={foto} alt="" referrerPolicy="no-referrer" className="benvinguda-foto absolute inset-0 h-full w-full object-cover object-[50%_15%]" />
      ) : (
        <div className="stripes absolute inset-0 bg-brand" />
      )}
      {/* Degradat blau del club perquè el text es llegeixi sobre la foto */}
      <div className="absolute inset-0 bg-gradient-to-b from-navy/30 via-transparent to-navy" />
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-navy via-navy/85 to-transparent" />

      <div className="relative flex h-full flex-col px-6 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-[calc(2rem+env(safe-area-inset-bottom))]">
        <div className="benvinguda-entra flex items-center gap-3" style={{ animationDelay: "100ms" }}>
          <Image src="/escut.png" alt="" width={56} height={56} className="h-14 w-14 object-contain drop-shadow-lg" />
          <div className="leading-none">
            <div className="display text-sm text-[#e0b36e]">CE Europa</div>
            <div className="display text-xl">Readaptació</div>
          </div>
        </div>

        <div className="mt-auto">
          <p className="benvinguda-entra display text-2xl text-[#e0b36e]" style={{ animationDelay: "250ms" }}>
            {text.salutacio},
          </p>
          <h1 className="benvinguda-entra display text-7xl leading-[0.9] drop-shadow-lg sm:text-8xl" style={{ animationDelay: "400ms" }}>
            {nom}
          </h1>
          <p className="benvinguda-entra mt-3 text-base text-white/85 first-letter:uppercase" style={{ animationDelay: "550ms" }}>
            {text.data}
          </p>
          <div className="benvinguda-entra mt-6 flex items-center gap-3" style={{ animationDelay: "700ms" }}>
            <span className="display rounded-full bg-white/15 px-4 py-2 text-sm backdrop-blur">
              {enReadaptacio === 0 ? "Cap jugador en readaptació" : `${enReadaptacio} ${enReadaptacio === 1 ? "jugador" : "jugadors"} en readaptació`}
            </span>
          </div>
          <div className="mt-8 h-1 overflow-hidden rounded-full bg-white/20">
            <div className="benvinguda-progres h-full bg-[#e0b36e]" style={{ animationDuration: `${DURADA_MS}ms` }} />
          </div>
          <p className="mt-2 text-center text-xs text-white/60">Toca per entrar</p>
        </div>
      </div>
    </div>
  );
}
