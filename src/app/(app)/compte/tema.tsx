"use client";

import { useState } from "react";
import { cx } from "@/components/ui";

const OPCIONS = [
  { value: "auto", label: "Automàtic", icona: "◐", desc: "Com el mòbil" },
  { value: "light", label: "Clar", icona: "☀", desc: "Dia de partit" },
  { value: "dark", label: "Fosc", icona: "☾", desc: "Nit de partit" },
] as const;

/** Aplica el tema a la pàgina i el desa en una cookie (el servidor el pinta sense parpelleig). */
function aplicaTema(v: string) {
  const html = document.documentElement;
  if (v === "auto") {
    html.removeAttribute("data-theme");
    document.cookie = "tema=; path=/; max-age=0; samesite=lax";
  } else {
    html.setAttribute("data-theme", v);
    document.cookie = `tema=${v}; path=/; max-age=31536000; samesite=lax`;
  }
}

/** Tria del tema: Automàtic, Clar o Fosc. */
export function TriaTema({ inicial }: { inicial: string }) {
  const [tema, setTema] = useState(inicial);
  const tria = (v: string) => {
    setTema(v);
    aplicaTema(v);
  };
  return (
    <div role="radiogroup" aria-label="Aparença" className="grid grid-cols-3 gap-2">
      {OPCIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={tema === o.value}
          onClick={() => tria(o.value)}
          className={cx(
            "flex flex-col items-center gap-1 rounded-2xl border-2 px-2 py-3 transition active:scale-95",
            tema === o.value ? "border-accent bg-accent-soft" : "border-border hover:bg-surface-2",
          )}
        >
          <span aria-hidden className="text-2xl leading-none">
            {o.icona}
          </span>
          <span className="display text-sm text-heading">{o.label}</span>
          <span className="text-[11px] text-muted">{o.desc}</span>
        </button>
      ))}
    </div>
  );
}
