"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "@/components/toast";
import { Button } from "@/components/ui";
import { esborraSubscripcio, guardaSubscripcio, provaAvis } from "@/lib/actions";

const VAPID_PUBLIC = "BGKg3vi79ZRI4WnSGZ_xo3yS89lZWjIoFGSuHg3KA8SQzzjPrzbQ540PqNY6Qr1nuyRvovEZemhdl0UQIT3qZLE";

function clauBytes(base64url: string) {
  const b64 = (base64url + "=".repeat((4 - (base64url.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

type Estat = "carregant" | "no-suportat" | "cal-instal·lar" | "bloquejat" | "inactiu" | "actiu";

function esIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}
function esApp() {
  return window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

/** Activar/desactivar els avisos al mòbil (wellness pendent i retorns previstos). */
export function Avisos() {
  const [estat, setEstat] = useState<Estat>("carregant");
  const [pending, start] = useTransition();

  useEffect(() => {
    (async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
        return setEstat(esIOS() && !esApp() ? "cal-instal·lar" : "no-suportat");
      }
      if (Notification.permission === "denied") return setEstat("bloquejat");
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      setEstat(sub ? "actiu" : "inactiu");
    })().catch(() => setEstat("no-suportat"));
  }, []);

  const activa = () =>
    start(async () => {
      try {
        const permis = await Notification.requestPermission();
        if (permis !== "granted") {
          setEstat(permis === "denied" ? "bloquejat" : "inactiu");
          return toast("Sense permís per enviar avisos", "error");
        }
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: clauBytes(VAPID_PUBLIC) });
        const j = sub.toJSON();
        const res = await guardaSubscripcio({ endpoint: sub.endpoint, p256dh: j.keys?.p256dh ?? "", auth: j.keys?.auth ?? "" });
        if (res.error) {
          await sub.unsubscribe();
          return toast(`No s'han pogut activar: ${res.error}`, "error");
        }
        setEstat("actiu");
        toast("Avisos activats");
      } catch {
        toast("No s'han pogut activar els avisos", "error");
      }
    });

  const desactiva = () =>
    start(async () => {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await esborraSubscripcio(sub.endpoint);
        await sub.unsubscribe();
      }
      setEstat("inactiu");
      toast("Avisos desactivats", "info");
    });

  const prova = () =>
    start(async () => {
      const r = await provaAvis();
      if (r.error) toast(`No s'ha pogut enviar: ${r.error}`, "error");
      else if (!r.enviats) toast("No s'ha enviat cap avís", "error");
      else toast("Avís de prova enviat", "info");
    });

  return (
    <div className="space-y-3 text-sm">
      <p className="text-muted">Cada matí t&apos;avisem si algun jugador lesionat no té el wellness fet i si algú té el retorn previst per l&apos;endemà.</p>
      {estat === "carregant" && <p className="text-muted">…</p>}
      {estat === "cal-instal·lar" && (
        <p className="rounded-xl bg-accent-soft p-3">
          A l&apos;iPhone, els avisos només funcionen amb l&apos;app instal·lada: toca <strong>Compartir</strong> → <strong>Afegir a la pantalla d&apos;inici</strong>, obre-la des de la icona i torna aquí.
        </p>
      )}
      {estat === "no-suportat" && <p className="text-muted">Aquest navegador no permet avisos.</p>}
      {estat === "bloquejat" && <p className="rounded-xl bg-surface-2 p-3">Has bloquejat els avisos. Activa&apos;ls a Configuració → Notificacions → Readaptació.</p>}
      {estat === "inactiu" && (
        <Button onClick={activa} disabled={pending} className="w-full sm:w-auto">
          {pending ? "Activant…" : "🔔 Activar avisos"}
        </Button>
      )}
      {estat === "actiu" && (
        <div className="flex flex-wrap gap-2">
          <span className="display inline-flex items-center rounded-full bg-accent-soft px-3 py-1.5 text-xs text-heading">✓ Avisos activats</span>
          <Button variant="secondary" onClick={prova} disabled={pending}>
            Enviar-me una prova
          </Button>
          <Button variant="ghost" onClick={desactiva} disabled={pending}>
            Desactivar
          </Button>
        </div>
      )}
    </div>
  );
}
