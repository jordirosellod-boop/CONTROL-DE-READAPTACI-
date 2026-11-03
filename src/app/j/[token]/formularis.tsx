"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChipMultiSelect, ScaleInput } from "@/components/forms";
import { Button, cx } from "@/components/ui";
import { enviaRpeJugador, enviaWellnessJugador } from "@/lib/actions-jugador";
import { formatDate } from "@/lib/calc";
import { WELLNESS_ITEMS, ZONES_COS } from "@/lib/constants";
import type { InfoJugador } from "@/lib/jugador";

const EMOJIS = ["😫", "😕", "😐", "🙂", "😄"];

/** Escala de Borg CR-10 explicada per al jugador. */
const BORG = [
  { v: 1, text: "Molt, molt suau", color: "bg-[#2e9e5b]" },
  { v: 2, text: "Suau", color: "bg-[#4fae55]" },
  { v: 3, text: "Moderada", color: "bg-[#8bbd45]" },
  { v: 4, text: "Una mica dura", color: "bg-[#c6c43a]" },
  { v: 5, text: "Dura", color: "bg-[#e8b730]" },
  { v: 6, text: "Dura +", color: "bg-[#ec9a2c]" },
  { v: 7, text: "Molt dura", color: "bg-[#e9792a]" },
  { v: 8, text: "Molt dura +", color: "bg-[#e05a2a]" },
  { v: 9, text: "Gairebé màxima", color: "bg-[#cf3b2b]" },
  { v: 10, text: "Màxima", color: "bg-[#a8202a]" },
];

function useEnviament(action: (prev: Awaited<ReturnType<typeof enviaRpeJugador>>, fd: FormData) => ReturnType<typeof enviaRpeJugador>) {
  const router = useRouter();
  const [state, formAction] = useActionState(async (prev: Awaited<ReturnType<typeof enviaRpeJugador>>, fd: FormData) => {
    const r = await action(prev, fd);
    if (r?.ok) router.refresh();
    return r;
  }, undefined);
  const [pending, start] = useTransition();
  return { state, pending, envia: (fd: FormData) => start(() => formAction(fd)) };
}

function Avis({ text }: { text?: string }) {
  if (!text) return null;
  return (
    <p role="alert" className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">
      {text}
    </p>
  );
}

function Gracies({ text, onMes }: { text: string; onMes?: () => void }) {
  return (
    <div className="mt-3 rounded-2xl bg-ok/10 p-5 text-center">
      <p className="text-4xl">🙌</p>
      <p className="display mt-1 text-xl text-heading">{text}</p>
      {onMes && (
        <button type="button" onClick={onMes} className="mt-2 text-sm font-medium text-accent underline">
          Puntuar una altra sessió
        </button>
      )}
    </div>
  );
}

export function FormWellness({ token }: { token: string }) {
  const { state, pending, envia } = useEnviament(enviaWellnessJugador.bind(null, token));
  const [dolor, setDolor] = useState(false);
  if (state?.ok) return <Gracies text="Wellness enviat. Gràcies!" />;
  return (
    <form
      className="mt-4 space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        envia(new FormData(e.currentTarget));
      }}
    >
      {WELLNESS_ITEMS.map((item) => (
        <fieldset key={item.key}>
          <legend className="mb-1.5 font-medium">{item.label}</legend>
          <ScaleInput name={item.key} min={1} max={5} low={item.baix} high={item.alt} emojis={EMOJIS} />
        </fieldset>
      ))}
      <label className="block">
        <span className="mb-1.5 block font-medium">Quantes hores has dormit?</span>
        <input name="son_hores" type="number" inputMode="decimal" step="0.5" min={0} max={24} placeholder="8" className="input max-w-32" />
      </label>
      <fieldset>
        <legend className="mb-1.5 font-medium">Tens dolor o molèsties? (0 = gens · 10 = màxim)</legend>
        <ScaleInput name="dolor_eva" min={0} max={10} invert defaultValue={0} low="Gens" high="Màxim" />
      </fieldset>
      {!dolor ? (
        <button type="button" onClick={() => setDolor(true)} className="text-sm font-medium text-accent underline">
          + Indicar on tinc dolor
        </button>
      ) : (
        <fieldset>
          <legend className="mb-2 font-medium">On?</legend>
          <ChipMultiSelect name="dolor_zones" options={ZONES_COS} />
        </fieldset>
      )}
      <label className="block">
        <span className="mb-1.5 block font-medium">Vols dir-nos alguna cosa? (opcional)</span>
        <textarea name="comentari" rows={2} maxLength={1000} className="input" />
      </label>
      <Avis text={state?.error} />
      <Button type="submit" disabled={pending} className="w-full py-4 text-base">
        {pending ? "Enviant…" : "Enviar wellness"}
      </Button>
    </form>
  );
}

export function FormRpe({ token, sessions }: { token: string; sessions: InfoJugador["sessions"] }) {
  const { state, pending, envia } = useEnviament(enviaRpeJugador.bind(null, token));
  const [rpe, setRpe] = useState<number | null>(null);
  const [triaSessio, setSessio] = useState(sessions[0]?.id ?? "nova");
  // Si la sessió triada ja s'ha puntuat (desapareix de la llista), es passa a la següent
  const sessio = triaSessio === "nova" || sessions.some((s) => s.id === triaSessio) ? triaSessio : (sessions[0]?.id ?? "nova");
  const [vist, setVist] = useState<number | undefined>(); // últim "gràcies" tancat
  const triada = sessions.find((s) => s.id === sessio);

  if (state?.ok && state.ts !== vist)
    return (
      <Gracies
        text="RPE enviat. Bon treball!"
        onMes={() => {
          setVist(state.ts);
          setRpe(null);
        }}
      />
    );
  return (
    <form
      key={vist ?? 0}
      className="mt-4 space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        envia(new FormData(e.currentTarget));
      }}
    >
      <fieldset>
        <legend className="mb-1.5 font-medium">Quina sessió?</legend>
        <div className="space-y-1.5">
          {sessions.map((s) => (
            <label key={s.id} className={cx("flex cursor-pointer items-center gap-3 rounded-xl border-2 px-3 py-2.5", sessio === s.id ? "border-accent bg-accent-soft" : "border-border")}>
              <input type="radio" name="sessio" value={s.id} checked={sessio === s.id} onChange={() => setSessio(s.id)} className="h-4 w-4 accent-[var(--accent)]" />
              <span className="min-w-0">
                <span className="block truncate font-medium">{s.nom || "Sessió de readaptació"}</span>
                <span className="block text-xs text-muted">{formatDate(s.data, { weekday: "long", day: "numeric", month: "long" })}</span>
              </span>
            </label>
          ))}
          <label className={cx("flex cursor-pointer items-center gap-3 rounded-xl border-2 px-3 py-2.5", sessio === "nova" ? "border-accent bg-accent-soft" : "border-border")}>
            <input type="radio" name="sessio" value="nova" checked={sessio === "nova"} onChange={() => setSessio("nova")} className="h-4 w-4 accent-[var(--accent)]" />
            <span className="font-medium">{sessions.length ? "Un altre entrenament d'avui" : "L'entrenament d'avui"}</span>
          </label>
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-1.5 font-medium">Com de dura ha estat? (1–10)</legend>
        <div className="grid grid-cols-5 gap-1.5">
          {BORG.map((b) => (
            <label key={b.v} className="block">
              <input type="radio" name="rpe" value={b.v} required checked={rpe === b.v} onChange={() => setRpe(b.v)} className="peer sr-only" />
              <span
                className={cx(
                  "display flex h-14 cursor-pointer items-center justify-center rounded-xl text-2xl transition active:scale-95 peer-focus-visible:outline-2 peer-focus-visible:outline-accent",
                  rpe === b.v ? cx(b.color, "scale-105 text-white shadow-md") : "bg-surface-2 text-heading",
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
        <span className="mb-1.5 block font-medium">Quants minuts ha durat?</span>
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
      <Avis text={state?.error} />
      <Button type="submit" disabled={pending} className="w-full py-4 text-base">
        {pending ? "Enviant…" : "Enviar RPE"}
      </Button>
    </form>
  );
}
