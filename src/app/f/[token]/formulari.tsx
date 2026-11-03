"use client";

import { useActionState, useState, useSyncExternalStore, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChipMultiSelect, ScaleInput } from "@/components/forms";
import { Button, cx } from "@/components/ui";
import { enviaRpeFormulari, enviaWellnessFormulari } from "@/lib/actions-formulari";
import { formatDate } from "@/lib/calc";
import { WELLNESS_ITEMS, ZONES_COS } from "@/lib/constants";
import type { FormState } from "@/lib/form";
import type { InfoFormulari } from "@/lib/formulari";

const EMOJIS = ["😫", "😕", "😐", "🙂", "😄"];
const CLAU_JUGADOR = "ra-form-jugador";

/** Escala de Borg CR-10 explicada per al jugador. */
const BORG = [
  { v: 1, text: "Molt, molt suau", color: "bg-[#2e9e5b]" },
  { v: 2, text: "Suau", color: "bg-[#4fae55]" },
  { v: 3, text: "Moderada", color: "bg-[#8bbd45]" },
  { v: 4, text: "Una mica dura", color: "bg-[#b5b232]" },
  { v: 5, text: "Dura", color: "bg-[#d9a520]" },
  { v: 6, text: "Dura +", color: "bg-[#e08a1f]" },
  { v: 7, text: "Molt dura", color: "bg-[#dd6b1f]" },
  { v: 8, text: "Molt dura +", color: "bg-[#d24f22]" },
  { v: 9, text: "Gairebé màxima", color: "bg-[#c13626]" },
  { v: 10, text: "Màxima", color: "bg-[#a01f28]" },
];

function Bloc({ children, className }: { children: React.ReactNode; className?: string }) {
  return <section className={cx("mt-4 rounded-3xl bg-surface p-5 shadow-sm ring-1 ring-border", className)}>{children}</section>;
}

function Pregunta({ children }: { children: React.ReactNode }) {
  return <legend className="mb-2 font-medium text-heading">{children}</legend>;
}

export function Formulari({ token, info }: { token: string; info: InfoFormulari }) {
  const router = useRouter();
  // Recorda qui ets en aquest mòbil (comoditat; si falla, no passa res)
  const desat = useSyncExternalStore(
    () => () => {},
    () => {
      try {
        return localStorage.getItem(CLAU_JUGADOR) ?? "";
      } catch {
        return "";
      }
    },
    () => "",
  );
  const [triat, setJugadorId] = useState<string | null>(null);
  const jugadorId = triat ?? (info.jugadors.some((j) => j.id === desat) ? desat : "");
  const [tipus, setTipus] = useState<"wellness" | "rpe" | null>(null);
  const [enviat, setEnviat] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const jugador = info.jugadors.find((j) => j.id === jugadorId) ?? null;


  const accio = async (prev: FormState, fd: FormData): Promise<FormState> => {
    const r = await (fd.get("tipus") === "rpe" ? enviaRpeFormulari(token, prev, fd) : enviaWellnessFormulari(token, prev, fd));
    if (r?.ok) {
      setEnviat(r.ok);
      router.refresh();
    }
    return r;
  };
  const [state, formAction] = useActionState(accio, undefined);

  if (enviat) {
    return (
      <Bloc className="text-center">
        <p className="text-5xl">🙌</p>
        <p className="display mt-2 text-2xl text-heading">{enviat === "rpe" ? "RPE enviat. Bon treball!" : "Wellness enviat. Gràcies!"}</p>
        <p className="mt-1 text-sm text-muted">Ja pots tancar aquesta pàgina.</p>
        <button
          type="button"
          onClick={() => {
            setEnviat(null);
            setTipus(null);
          }}
          className="mt-4 text-sm font-medium text-accent underline"
        >
          Enviar una altra resposta
        </button>
      </Bloc>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        start(() => formAction(fd));
      }}
    >
      <Bloc>
        <label className="block">
          <span className="mb-2 block font-medium text-heading">Qui ets?</span>
          <select
            name="jugador"
            required
            value={jugadorId}
            onChange={(e) => {
              setJugadorId(e.target.value);
              try {
                localStorage.setItem(CLAU_JUGADOR, e.target.value);
              } catch {
                // sense emmagatzematge
              }
            }}
            className="input text-base"
          >
            <option value="">— Tria el teu nom —</option>
            {info.jugadors.map((j) => (
              <option key={j.id} value={j.id}>
                {j.nom} {j.cognoms}
                {j.dorsal != null ? ` (${j.dorsal})` : ""}
              </option>
            ))}
          </select>
        </label>

        {jugador && (
          <fieldset className="mt-5">
            <Pregunta>Què vols enviar?</Pregunta>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { v: "wellness", titol: "😊 Wellness", sub: jugador.wellness_avui ? "Ja fet avui ✓" : "Al matí" },
                  { v: "rpe", titol: "💪 RPE", sub: "Després d'entrenar" },
                ] as const
              ).map((o) => (
                <label key={o.v} className={cx("cursor-pointer rounded-2xl border-2 p-3 text-center transition", tipus === o.v ? "border-accent bg-accent-soft" : "border-border")}>
                  <input type="radio" name="tipus" value={o.v} checked={tipus === o.v} onChange={() => setTipus(o.v)} className="sr-only" required />
                  <span className="display block text-lg text-heading">{o.titol}</span>
                  <span className="block text-xs text-muted">{o.sub}</span>
                </label>
              ))}
            </div>
          </fieldset>
        )}
      </Bloc>

      {jugador && tipus === "wellness" && (
        <Bloc>
          <h2 className="display text-xl text-heading">Com et trobes avui?</h2>
          {jugador.wellness_avui && <p className="mt-1 text-sm text-muted">Ja l&apos;has enviat avui. Si l&apos;envies de nou, se substitueix.</p>}
          <div className="mt-4 space-y-5">
            {WELLNESS_ITEMS.map((item) => (
              <fieldset key={item.key}>
                <Pregunta>{item.label}</Pregunta>
                <ScaleInput name={item.key} min={1} max={5} low={item.baix} high={item.alt} emojis={EMOJIS} />
              </fieldset>
            ))}
            <label className="block">
              <span className="mb-2 block font-medium text-heading">Quantes hores has dormit?</span>
              <input name="son_hores" type="number" inputMode="decimal" step="0.5" min={0} max={24} placeholder="8" className="input max-w-32" />
            </label>
            <fieldset>
              <Pregunta>Tens dolor o molèsties? (0 = gens · 10 = màxim)</Pregunta>
              <ScaleInput name="dolor_eva" min={0} max={10} invert defaultValue={0} low="Gens" high="Màxim" />
            </fieldset>
            <details>
              <summary className="cursor-pointer text-sm font-medium text-accent">+ Indicar on tinc dolor</summary>
              <div className="mt-3">
                <ChipMultiSelect name="dolor_zones" options={ZONES_COS} />
              </div>
            </details>
            <label className="block">
              <span className="mb-2 block font-medium text-heading">Vols dir-nos alguna cosa? (opcional)</span>
              <textarea name="comentari" rows={2} maxLength={1000} className="input" />
            </label>
          </div>
        </Bloc>
      )}

      {jugador && tipus === "rpe" && <BlocRpe key={jugador.id} sessions={jugador.sessions} />}

      {jugador && tipus && (
        <div className="mt-4 space-y-3">
          {state?.error && (
            <p role="alert" className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">
              {state.error}
            </p>
          )}
          <Button type="submit" disabled={pending} className="w-full py-4 text-base">
            {pending ? "Enviant…" : "Enviar"}
          </Button>
        </div>
      )}
    </form>
  );
}

function BlocRpe({ sessions }: { sessions: InfoFormulari["jugadors"][number]["sessions"] }) {
  const [rpe, setRpe] = useState<number | null>(null);
  const [sessio, setSessio] = useState(sessions[0]?.id ?? "nova");
  const triada = sessions.find((s) => s.id === sessio);
  return (
    <Bloc>
      <h2 className="display text-xl text-heading">Com de dura ha estat la sessió?</h2>
      <p className="mt-1 text-sm text-muted">Respon uns 30 minuts després d&apos;acabar.</p>
      <div className="mt-4 space-y-5">
        {sessions.length > 0 && (
          <fieldset>
            <Pregunta>Quina sessió?</Pregunta>
            <div className="space-y-1.5">
              {[...sessions.map((s) => ({ id: s.id, titol: s.nom || "Sessió de readaptació", sub: formatDate(s.data, { weekday: "long", day: "numeric", month: "long" }) })), { id: "nova", titol: "Un altre entrenament d'avui", sub: "" }].map((o) => (
                <label key={o.id} className={cx("flex cursor-pointer items-center gap-3 rounded-xl border-2 px-3 py-2.5", sessio === o.id ? "border-accent bg-accent-soft" : "border-border")}>
                  <input type="radio" name="sessio" value={o.id} checked={sessio === o.id} onChange={() => setSessio(o.id)} className="h-4 w-4 accent-[var(--accent)]" />
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{o.titol}</span>
                    {o.sub && <span className="block text-xs text-muted">{o.sub}</span>}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        )}
        <fieldset>
          <Pregunta>Esforç de la sessió (1–10)</Pregunta>
          <div className="grid grid-cols-5 gap-1.5">
            {BORG.map((b) => (
              <label key={b.v} className="block">
                <input type="radio" name="rpe" value={b.v} required checked={rpe === b.v} onChange={() => setRpe(b.v)} className="peer sr-only" />
                <span
                  className={cx(
                    "display flex h-14 cursor-pointer items-center justify-center rounded-xl text-2xl active:scale-95 peer-focus-visible:outline-2 peer-focus-visible:outline-accent",
                    rpe === b.v ? cx(b.color, "text-white shadow-md") : "bg-surface-2 text-heading",
                  )}
                >
                  {b.v}
                </span>
              </label>
            ))}
          </div>
          <p className={cx("display mt-2 h-7 text-center text-xl", rpe ? "text-heading" : "text-muted")}>{rpe ? BORG[rpe - 1].text : "Toca un número"}</p>
        </fieldset>
        <label className="block">
          <span className="mb-2 block font-medium text-heading">Quants minuts ha durat?</span>
          <input
            key={sessio}
            name="durada_min"
            type="number"
            inputMode="numeric"
            min={1}
            max={600}
            required={!triada?.durada_min}
            defaultValue={triada?.durada_min ?? ""}
            placeholder="60"
            className="input max-w-32"
          />
        </label>
      </div>
    </Bloc>
  );
}
