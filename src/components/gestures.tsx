"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { toast } from "./toast";
import { cx } from "./ui";

const LLINDAR = 72;

/** Està instal·lada a la pantalla d'inici? (a Safari ja hi ha "estirar per actualitzar") */
function esApp() {
  return window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

/** Estirar cap avall des de dalt de tot per actualitzar les dades (només amb l'app instal·lada). */
export function PullToRefresh() {
  const router = useRouter();
  const [pull, setPull] = useState(0);
  const [pending, start] = useTransition();
  const inici = useRef<number | null>(null);
  const pullRef = useRef(0);

  useEffect(() => {
    if (!esApp()) return;
    const onStart = (e: TouchEvent) => {
      inici.current = window.scrollY <= 0 && e.touches.length === 1 ? e.touches[0].clientY : null;
    };
    const onMove = (e: TouchEvent) => {
      if (inici.current == null) return;
      const d = e.touches[0].clientY - inici.current;
      pullRef.current = d > 0 ? Math.min(120, d * 0.55) : 0;
      setPull(pullRef.current);
    };
    const onEnd = () => {
      if (pullRef.current >= LLINDAR) {
        start(() => router.refresh());
        toast("Dades actualitzades", "info");
      }
      inici.current = null;
      pullRef.current = 0;
      setPull(0);
    };
    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onEnd);
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
    };
  }, [router]);

  const visible = pull > 4 || pending;
  if (!visible) return null;
  const llest = pull >= LLINDAR;
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 top-[calc(4.5rem+env(safe-area-inset-top))] z-30 flex justify-center print:hidden" style={{ transform: `translateY(${pending ? 16 : pull / 2}px)` }}>
      <span className={cx("flex items-center gap-2 rounded-full bg-surface px-3 py-2 shadow-lg ring-1 ring-border", pending && "animate-pulse")}>
        <Image src="/escut.png" alt="" width={24} height={24} className="h-6 w-6" style={{ transform: `rotate(${pending ? 0 : pull * 3}deg)` }} />
        <span className="display text-xs text-heading">{pending ? "Actualitzant…" : llest ? "Deixa anar per actualitzar" : "Estira per actualitzar"}</span>
      </span>
    </div>
  );
}

/** Lliscar a esquerra/dreta per passar a la pestanya següent/anterior. */
export function SwipeTabs({ prev, next, children }: { prev: string | null; next: string | null; children: ReactNode }) {
  const router = useRouter();
  const inici = useRef<{ x: number; y: number } | null>(null);
  return (
    <div
      onTouchStart={(e) => {
        const t = e.target as HTMLElement;
        // No canviar de pestanya si es llisca sobre un gràfic, una taula o un element desplaçable
        if (t.closest(".recharts-wrapper, .overflow-x-auto, input, textarea, [data-swipe-row]")) return void (inici.current = null);
        inici.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }}
      onTouchEnd={(e) => {
        if (!inici.current) return;
        const dx = e.changedTouches[0].clientX - inici.current.x;
        const dy = e.changedTouches[0].clientY - inici.current.y;
        inici.current = null;
        if (Math.abs(dx) < 80 || Math.abs(dy) > 50) return;
        const desti = dx < 0 ? next : prev;
        if (desti) router.push(desti, { scroll: false });
      }}
    >
      {children}
    </div>
  );
}

/** Fila que es llisca cap a l'esquerra per mostrar "Eliminar" (com a les apps de correu). */
export function SwipeRow({ children, onDelete, confirm }: { children: ReactNode; onDelete: () => Promise<unknown>; confirm: string }) {
  const [x, setX] = useState(0);
  const [obert, setObert] = useState(false);
  const [pending, start] = useTransition();
  const [arrossega, setArrossega] = useState(false);
  const inici = useRef<{ x: number; y: number; base: number } | null>(null);
  const mogut = useRef(false);
  const AMPLE = 96;

  return (
    <div data-swipe-row className="relative overflow-hidden">
      <button
        type="button"
        aria-label="Eliminar"
        tabIndex={obert ? 0 : -1}
        disabled={pending}
        onClick={() => {
          if (!window.confirm(confirm)) return;
          start(async () => void (await onDelete()));
        }}
        className="display absolute inset-y-0 right-0 flex w-24 items-center justify-center bg-danger text-sm text-white"
      >
        {pending ? "…" : "Eliminar"}
      </button>
      <div
        className="relative bg-surface"
        style={{ transform: `translateX(${x}px)`, transition: arrossega ? "none" : "transform 0.2s ease-out" }}
        onTouchStart={(e) => {
          inici.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, base: obert ? -AMPLE : 0 };
          mogut.current = false;
          setArrossega(true);
        }}
        onTouchMove={(e) => {
          if (!inici.current) return;
          const dx = e.touches[0].clientX - inici.current.x;
          const dy = e.touches[0].clientY - inici.current.y;
          if (!mogut.current && Math.abs(dy) > Math.abs(dx)) return void (inici.current = null);
          if (Math.abs(dx) > 8) mogut.current = true;
          setX(Math.max(-AMPLE - 20, Math.min(0, inici.current.base + dx)));
        }}
        onTouchEnd={() => {
          setArrossega(false);
          if (!inici.current) return;
          const obre = x < -AMPLE / 2;
          setObert(obre);
          setX(obre ? -AMPLE : 0);
          inici.current = null;
        }}
        onClickCapture={(e) => {
          // Si s'ha lliscat (o la fila és oberta), el toc no obre l'enllaç
          if (mogut.current || obert) {
            e.preventDefault();
            e.stopPropagation();
            mogut.current = false;
            if (obert) {
              setObert(false);
              setX(0);
            }
          }
        }}
      >
        {children}
      </div>
    </div>
  );
}
