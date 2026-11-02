"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { enviaCua, llegeixCua } from "@/lib/cua";
import { toast } from "./toast";

/** Registra el service worker (pàgines sense connexió i notificacions). */
export function RegistraSW() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {});
  }, []);
  return null;
}

/** Franja "sense connexió" i enviament automàtic del que s'ha desat al mòbil. */
export function Connexio() {
  const router = useRouter();
  const [enLinia, setEnLinia] = useState(true);
  const [pendents, setPendents] = useState(0);

  useEffect(() => {
    const actualitza = () => {
      setEnLinia(navigator.onLine);
      setPendents(llegeixCua().length);
    };
    const envia = async () => {
      actualitza();
      try {
        const n = await enviaCua();
        if (n > 0) {
          toast(n === 1 ? "1 registre pendent enviat" : `${n} registres pendents enviats`);
          router.refresh();
        }
      } catch {}
      actualitza();
    };
    void envia();
    window.addEventListener("online", envia);
    window.addEventListener("offline", actualitza);
    window.addEventListener("ra-cua", actualitza);
    return () => {
      window.removeEventListener("online", envia);
      window.removeEventListener("offline", actualitza);
      window.removeEventListener("ra-cua", actualitza);
    };
  }, [router]);

  if (enLinia && pendents === 0) return null;
  return (
    <div role="status" className="sticky top-[calc(4rem+env(safe-area-inset-top))] z-10 bg-warn px-4 py-1.5 text-center text-xs font-medium text-white print:hidden">
      {enLinia ? `Enviant ${pendents} registre${pendents === 1 ? "" : "s"} pendent${pendents === 1 ? "" : "s"}…` : `Sense connexió · veus les dades de l'última visita${pendents ? ` · ${pendents} pendent${pendents === 1 ? "" : "s"} d'enviar` : ""}`}
    </div>
  );
}
