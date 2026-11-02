"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

/**
 * Finestra que puja des de baix (com les apps natives). Es tanca tocant el fons,
 * amb Escape o arrossegant-la cap avall.
 */
export function BottomSheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const [drag, setDrag] = useState(0);
  const inici = useRef<number | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [open, onClose]);

  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[55] print:hidden" role="dialog" aria-modal="true" aria-label={title}>
      <button aria-label="Tancar" className="sheet-fons absolute inset-0 bg-navy/50 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className="sheet-puja absolute inset-x-0 bottom-0 mx-auto max-h-[85dvh] max-w-lg overflow-hidden rounded-t-3xl bg-surface pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_40px_rgba(11,27,77,0.3)]"
        style={{ transform: drag ? `translateY(${drag}px)` : undefined, transition: drag ? "none" : undefined }}
      >
        {/* Nansa per arrossegar */}
        <div
          className="flex cursor-grab touch-none justify-center pt-3 pb-2"
          onPointerDown={(e) => {
            inici.current = e.clientY;
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => inici.current != null && setDrag(Math.max(0, e.clientY - inici.current))}
          onPointerUp={() => {
            if (drag > 90) onClose();
            setDrag(0);
            inici.current = null;
          }}
        >
          <span className="h-1.5 w-12 rounded-full bg-border" />
        </div>
        <h2 className="display px-5 pb-3 text-xl text-heading">{title}</h2>
        <div className="max-h-[calc(85dvh-4rem)] overflow-y-auto px-5 pb-5">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
