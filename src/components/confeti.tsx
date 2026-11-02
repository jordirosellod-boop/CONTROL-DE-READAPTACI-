"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

const COLORS = ["#0a2ea0", "#ffffff", "#e0b36e", "#3987e5"];
// Pseudoaleatori determinista (mateix resultat a cada render)
const rnd = (i: number, s: number) => {
  const x = Math.sin(i * 12.9898 + s * 78.233) * 43758.5453;
  return x - Math.floor(x);
};
const PECES = Array.from({ length: 80 }, (_, i) => ({
  left: rnd(i, 1) * 100,
  delay: rnd(i, 2) * 0.6,
  dur: 1.8 + rnd(i, 3) * 1.4,
  rot: rnd(i, 4) * 720 - 360,
  drift: rnd(i, 5) * 120 - 60,
  w: 6 + rnd(i, 6) * 6,
  color: COLORS[i % COLORS.length],
}));

/** Celebració amb confeti dels colors del club (es tanca sola). */
export function Confeti({ missatge, onFi }: { missatge: string; onFi: () => void }) {
  useEffect(() => {
    const t = setTimeout(onFi, 3200);
    return () => clearTimeout(t);
  }, [onFi]);
  // Portal al <body>: així és "fixed" respecte a la pantalla encara que algun pare tingui animacions
  return createPortal(
    <div role="status" className="pointer-events-none fixed inset-0 z-50 overflow-hidden print:hidden">
      {PECES.map((p, i) => (
        <span
          key={i}
          className="confeti absolute top-[-20px] rounded-[2px] shadow-sm"
          style={
            {
              left: `${p.left}%`,
              width: p.w,
              height: p.w * 1.6,
              background: p.color,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.dur}s`,
              "--rot": `${p.rot}deg`,
              "--drift": `${p.drift}px`,
            } as React.CSSProperties
          }
        />
      ))}
      <div className="absolute inset-x-0 top-1/3 flex justify-center px-6">
        <div className="confeti-missatge stripes rounded-3xl bg-brand px-7 py-5 text-center text-white shadow-2xl ring-4 ring-[#e0b36e]">
          <div className="text-4xl">🎉</div>
          <div className="display mt-1 text-3xl leading-none">{missatge}</div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
