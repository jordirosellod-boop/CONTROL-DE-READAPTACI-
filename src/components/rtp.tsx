"use client";

import { useTransition } from "react";
import { FASES } from "@/lib/constants";
import { cx } from "./ui";

/**
 * Línia de temps del retorn al joc: 5 fases, la fase actual ressaltada en daurat.
 * Tocant una fase es canvia (si es passen les accions).
 */
export function RtpTimeline({ fase, accions }: { fase: number; accions?: (() => Promise<unknown>)[] }) {
  const [pending, start] = useTransition();
  const actual = FASES.find((f) => f.n === fase) ?? FASES[0];
  return (
    <div className={cx(pending && "opacity-60")}>
      <ol className="relative grid grid-cols-5">
        {/* Línia de fons i línia de progrés */}
        <div aria-hidden className="absolute top-4 right-[10%] left-[10%] h-1 rounded-full bg-surface-2" />
        <div aria-hidden className="absolute top-4 left-[10%] h-1 rounded-full bg-accent transition-all duration-500" style={{ width: `${((fase - 1) / 4) * 80}%` }} />
        {FASES.map((f, i) => {
          const fet = f.n < fase;
          const ara = f.n === fase;
          const contingut = (
            <>
              <span
                className={cx(
                  "display relative z-10 grid h-9 w-9 place-items-center rounded-full border-2 text-sm transition",
                  fet && "border-accent bg-accent text-accent-fg",
                  ara && "scale-110 border-[#e0b36e] bg-[#e0b36e] text-navy shadow-[0_0_0_4px_rgba(224,179,110,0.25)]",
                  !fet && !ara && "border-border bg-surface text-muted",
                )}
              >
                {fet ? "✓" : f.n}
              </span>
              <span className={cx("mt-1.5 text-center text-[10px] leading-tight sm:block sm:text-xs print:block", ara ? "font-semibold text-foreground" : "hidden text-muted")}>{f.curt}</span>
            </>
          );
          return (
            <li key={f.n} className="flex flex-col items-center">
              {accions ? (
                <button
                  type="button"
                  disabled={pending || ara}
                  onClick={() => start(async () => void (await accions[i]()))}
                  className="flex flex-col items-center rounded-lg p-1 active:scale-95 disabled:cursor-default"
                  aria-label={`Passar a la fase ${f.n}: ${f.nom}`}
                  aria-current={ara ? "step" : undefined}
                >
                  {contingut}
                </button>
              ) : (
                <div className="flex flex-col items-center p-1" aria-current={ara ? "step" : undefined}>
                  {contingut}
                </div>
              )}
            </li>
          );
        })}
      </ol>
      <p className="mt-3 rounded-xl bg-surface-2 px-3 py-2 text-sm">
        <span className="display text-heading">
          Fase {actual.n} · {actual.nom}
        </span>
        <span className="block text-muted">{actual.desc}</span>
      </p>
    </div>
  );
}
