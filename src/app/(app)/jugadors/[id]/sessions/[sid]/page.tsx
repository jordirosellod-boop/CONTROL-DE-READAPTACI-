import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ActionButton, ActionForm, ScaleInput, SubmitButton } from "@/components/forms";
import { ImatgeInput } from "@/components/imatge-input";
import { VideoEmbed } from "@/components/video";
import { Card, Empty, Field, Input, LinkButton, PageHeader, Select, Textarea } from "@/components/ui";
import {
  addSessionExercise,
  aplicaProgressio,
  deleteFieldWork,
  deleteSession,
  deleteSessionExercise,
  duplicateSession,
  moveSessionExercise,
  saveFieldWork,
  updateSession,
  updateSessionExercise,
} from "@/lib/actions";
import { formatDate, sessionLoad, suggerimentProgressio, type Suggeriment } from "@/lib/calc";
import { getDb, getExercises, getPlayer, getSessionDetail } from "@/lib/data";
import { DesaPlantilla } from "./desa-plantilla";
import type { SessionExercise } from "@/lib/types";

export const metadata: Metadata = { title: "Sessió" };

export default async function SessioPage({ params }: PageProps<"/jugadors/[id]/sessions/[sid]">) {
  const { id, sid } = await params;
  const [player, session, library] = await Promise.all([getPlayer(id), getSessionDetail(sid), getExercises()]);
  if (session.player_id !== id) notFound();
  const fw = session.field_work;
  const load = sessionLoad(session);
  const suggeriments = session.completada ? new Map<string, Suggeriment>() : await calculaSuggeriments(id, session.data, session.session_exercises);

  return (
    <>
      <PageHeader
        title={session.nom || "Sessió"}
        subtitle={`${player.nom} ${player.cognoms} · ${formatDate(session.data, { weekday: "long", day: "numeric", month: "long" })}`}
        back={{ href: `/jugadors/${id}?tab=sessions`, label: "Sessions" }}
        actions={
          <>
            {session.session_exercises.length > 0 && <DesaPlantilla sessionId={sid} nom={session.nom ?? ""} />}
            <LinkButton href={`/jugadors/${id}/sessions/${sid}/pdf`} variant="secondary">
              📄 PDF
            </LinkButton>
            <ActionButton action={duplicateSession.bind(null, id, sid)} size="md">
              Duplicar per avui
            </ActionButton>
            <ActionButton action={deleteSession.bind(null, id, sid)} variant="danger" size="md" confirm="Eliminar aquesta sessió i tots els seus exercicis?">
              Eliminar
            </ActionButton>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          <Card title={`Exercicis (${session.session_exercises.length})`}>
            {session.session_exercises.length === 0 ? (
              <Empty>Encara no hi ha exercicis. Afegeix-ne a sota.</Empty>
            ) : (
              <ol className="space-y-2">
                {session.session_exercises.map((e, i) => (
                  <li key={e.id}>
                    <ExerciseItem playerId={id} sessionId={sid} e={e} index={i} total={session.session_exercises.length} sug={suggeriments.get(e.id)} />
                  </li>
                ))}
              </ol>
            )}
          </Card>

          <Card title="Afegir exercici">
            <ActionForm action={addSessionExercise.bind(null, id, sid)} resetOnSuccess>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="De la biblioteca">
                  <Select name="exercise_id" options={library.map((x) => ({ value: x.id, label: x.nom }))} placeholder={library.length ? "— Tria un exercici —" : "Biblioteca buida"} />
                </Field>
                <Field label="…o exercici nou">
                  <Input name="nom" placeholder="Nom de l'exercici" />
                </Field>
                <div className="sm:col-span-2">
                  <ImatgeInput label="Imatge (opcional)" />
                  <p className="mt-1 text-xs text-muted">Si tries un exercici de la biblioteca i no hi poses imatge, s&apos;utilitza la seva.</p>
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="guardar_biblioteca" defaultChecked className="h-4 w-4 accent-[var(--accent)]" />
                Desar l&apos;exercici nou a la biblioteca
              </label>
              <ExerciseParams />
              <SubmitButton>Afegir a la sessió</SubmitButton>
            </ActionForm>
          </Card>
        </div>

        <div className="space-y-4">
          <Card title="Dades de la sessió">
            <ActionForm action={updateSession.bind(null, id, sid)}>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Data">
                  <Input name="data" type="date" required defaultValue={session.data} />
                </Field>
                <Field label="Durada (min)">
                  <Input name="durada_min" type="number" inputMode="numeric" min={0} max={600} defaultValue={session.durada_min ?? ""} />
                </Field>
              </div>
              <Field label="Nom">
                <Input name="nom" defaultValue={session.nom ?? ""} />
              </Field>
              <fieldset>
                <legend className="mb-1.5 text-sm font-medium">RPE de la sessió (Borg CR-10)</legend>
                <ScaleInput name="rpe" min={1} max={10} invert required={false} defaultValue={session.rpe != null ? Number(session.rpe) : null} low="1 · Molt suau" high="10 · Màxim" />
              </fieldset>
              <Field label="Notes">
                <Textarea name="notes" rows={2} defaultValue={session.notes ?? ""} />
              </Field>
              <label className="flex items-center gap-3 rounded-xl border border-border px-3 py-2.5">
                <input type="checkbox" name="completada" defaultChecked={session.completada} className="h-5 w-5 accent-[var(--accent)]" />
                <span className="text-sm font-medium">Sessió completada</span>
              </label>
              {load > 0 && <p className="text-sm text-muted">Càrrega interna: <span className="font-medium text-foreground">{load} UA</span> (sRPE)</p>}
              <SubmitButton className="w-full">Desar sessió</SubmitButton>
            </ActionForm>
          </Card>

          <Card title="Carrera i treball de camp" actions={fw && <ActionButton action={deleteFieldWork.bind(null, id, sid)} variant="ghost" confirm="Esborrar el treball de camp?">Esborrar</ActionButton>}>
            <ActionForm action={saveFieldWork.bind(null, id, sid)}>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Minuts de carrera">
                  <Input name="minuts_carrera" type="number" inputMode="decimal" step="any" min={0} defaultValue={fw?.minuts_carrera ?? ""} />
                </Field>
                <Field label="Distància (km)">
                  <Input name="distancia_km" type="number" inputMode="decimal" step="0.01" min={0} defaultValue={fw?.distancia_m != null ? fw.distancia_m / 1000 : ""} />
                </Field>
                <Field label="Vel. màxima (km/h)">
                  <Input name="vel_max_kmh" type="number" inputMode="decimal" step="0.1" min={0} max={50} defaultValue={fw?.vel_max_kmh ?? ""} />
                </Field>
                <Field label="Vel. mitjana (km/h)">
                  <Input name="vel_mitjana_kmh" type="number" inputMode="decimal" step="0.1" min={0} max={50} defaultValue={fw?.vel_mitjana_kmh ?? ""} />
                </Field>
                <Field label="Esprints">
                  <Input name="esprints" type="number" inputMode="numeric" min={0} defaultValue={fw?.esprints ?? ""} />
                </Field>
                <Field label="Canvis de direcció">
                  <Input name="canvis_direccio" type="number" inputMode="numeric" min={0} defaultValue={fw?.canvis_direccio ?? ""} />
                </Field>
                <Field label="Acceleracions">
                  <Input name="acceleracions" type="number" inputMode="numeric" min={0} defaultValue={fw?.acceleracions ?? ""} />
                </Field>
                <Field label="Desacceleracions">
                  <Input name="desacceleracions" type="number" inputMode="numeric" min={0} defaultValue={fw?.desacceleracions ?? ""} />
                </Field>
              </div>
              <Field label="Tipus de treball">
                <Input name="tipus_treball" defaultValue={fw?.tipus_treball ?? ""} placeholder="p. ex. Carrera contínua, CODs 45°/90°, RSA..." />
              </Field>
              <Field label="Notes">
                <Textarea name="notes" rows={2} defaultValue={fw?.notes ?? ""} />
              </Field>
              <SubmitButton className="w-full">Desar treball de camp</SubmitButton>
            </ActionForm>
          </Card>
        </div>
      </div>
    </>
  );
}

function ExerciseParams({ e }: { e?: SessionExercise }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <Field label="Sèries">
        <Input name="series" type="number" inputMode="numeric" min={0} defaultValue={e?.series ?? ""} />
      </Field>
      <Field label="Reps">
        <Input name="repeticions" type="number" inputMode="numeric" min={0} defaultValue={e?.repeticions ?? ""} />
      </Field>
      <Field label="Temps (s)">
        <Input name="temps_s" type="number" inputMode="numeric" min={0} defaultValue={e?.temps_s ?? ""} />
      </Field>
      <Field label="Càrrega">
        <Input name="carrega" defaultValue={e?.carrega ?? ""} placeholder="20 kg" />
      </Field>
      <Field label="Descans (s)">
        <Input name="descans_s" type="number" inputMode="numeric" min={0} defaultValue={e?.descans_s ?? ""} />
      </Field>
      <Field label="RPE (1–10)">
        <Input name="rpe" type="number" inputMode="decimal" min={1} max={10} step="0.5" defaultValue={e?.rpe ?? ""} />
      </Field>
      <Field label="Notes" className="col-span-3">
        <Input name="notes" defaultValue={e?.notes ?? ""} />
      </Field>
    </div>
  );
}

function summary(e: SessionExercise) {
  const vol = e.series != null && (e.repeticions != null || e.temps_s != null) ? `${e.series} × ${e.repeticions ?? `${e.temps_s} s`}` : e.repeticions != null ? `${e.repeticions} reps` : e.temps_s != null ? `${e.temps_s} s` : null;
  return [vol, e.carrega, e.descans_s != null && `desc. ${e.descans_s} s`, e.rpe != null && `RPE ${e.rpe}`].filter(Boolean).join(" · ");
}

/**
 * Per a cada exercici, busca la darrera vegada que el jugador el va fer (sessió completada)
 * i el dolor dels dies posteriors, i proposa la progressió si va ser còmode.
 */
async function calculaSuggeriments(playerId: string, data: string, exercicis: SessionExercise[]) {
  const res = new Map<string, Suggeriment>();
  if (exercicis.length === 0) return res;
  const { supabase } = await getDb();
  const { data: previes } = await supabase
    .from("ra_sessions")
    .select("data, rpe, session_exercises:ra_session_exercises(nom, exercise_id, series, repeticions, temps_s, carrega, rpe)")
    .eq("player_id", playerId)
    .eq("completada", true)
    .lt("data", data)
    .order("data", { ascending: false })
    .limit(30);
  const sessions = (previes ?? []) as { data: string; rpe: number | null; session_exercises: (Pick<SessionExercise, "nom" | "exercise_id" | "series" | "repeticions" | "temps_s" | "carrega" | "rpe">)[] }[];
  if (sessions.length === 0) return res;
  const desde = sessions[sessions.length - 1].data;
  const { data: well } = await supabase.from("ra_wellness_entries").select("data, dolor_eva").eq("player_id", playerId).gte("data", desde).lte("data", data);
  const dolors = (well ?? []) as { data: string; dolor_eva: number }[];
  for (const e of exercicis) {
    const mateix = (x: { nom: string; exercise_id: string | null }) => (e.exercise_id && x.exercise_id === e.exercise_id) || x.nom.trim().toLowerCase() === e.nom.trim().toLowerCase();
    const s = sessions.find((ss) => ss.session_exercises.some(mateix));
    if (!s) continue;
    const prev = s.session_exercises.find(mateix)!;
    const dolor = dolors.filter((w) => w.data >= s.data && w.data <= data).reduce<number | null>((m, w) => Math.max(m ?? 0, w.dolor_eva), null);
    const sug = suggerimentProgressio(e, { params: prev, rpeSessio: s.rpe, rpeExercici: prev.rpe }, dolor);
    if (sug) res.set(e.id, sug);
  }
  return res;
}

function ExerciseItem({ playerId, sessionId, e, index, total, sug }: { playerId: string; sessionId: string; e: SessionExercise; index: number; total: number; sug?: Suggeriment }) {
  return (
    <details className="group rounded-xl border border-border">
      <summary className="flex cursor-pointer list-none items-center gap-3 px-3 py-3">
        {e.imatge_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={e.imatge_url} alt="" className="h-11 w-11 shrink-0 rounded-lg border border-border object-cover" />
        ) : (
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-surface-2 text-xs font-semibold">{index + 1}</span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium">
            {e.imatge_url && <span className="text-muted">{index + 1}. </span>}
            {e.nom}
          </span>
          <span className="block truncate text-sm text-muted">{summary(e) || "Sense paràmetres"}</span>
          {sug && <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-ok/12 px-2 py-0.5 text-xs font-medium text-ok">💡 Pot progressar: {sug.text}</span>}
        </span>
        <span aria-hidden className="text-muted transition group-open:rotate-180">⌄</span>
      </summary>
      <div className="space-y-4 border-t border-border p-3">
        {sug && (
          <div className="flex flex-wrap items-center gap-2 rounded-xl bg-ok/10 p-3 text-sm">
            <span className="min-w-0 flex-1">💡 La darrera vegada va ser còmode (RPE ≤ 6) i sense dolor. Proposta: <strong>{sug.text}</strong></span>
            <ActionButton action={aplicaProgressio.bind(null, playerId, sessionId, e.id, sug.canvis)}>Aplicar</ActionButton>
          </div>
        )}
        <VideoEmbed url={e.video_url} title={e.nom} />
        <ActionForm action={updateSessionExercise.bind(null, playerId, sessionId, e.id)}>
          <Field label="Nom">
            <Input name="nom" required defaultValue={e.nom} />
          </Field>
          <ImatgeInput actual={e.imatge_url} />
          <ExerciseParams e={e} />
          <div className="flex flex-wrap items-center gap-2">
            <SubmitButton size="sm">Desar</SubmitButton>
            {index > 0 && <ActionButton action={moveSessionExercise.bind(null, playerId, sessionId, e.id, -1)} variant="ghost">↑ Amunt</ActionButton>}
            {index < total - 1 && <ActionButton action={moveSessionExercise.bind(null, playerId, sessionId, e.id, 1)} variant="ghost">↓ Avall</ActionButton>}
            <span className="ml-auto">
              <ActionButton action={deleteSessionExercise.bind(null, playerId, sessionId, e.id)} variant="danger" confirm={`Treure «${e.nom}» de la sessió?`}>
                Treure
              </ActionButton>
            </span>
          </div>
        </ActionForm>
      </div>
    </details>
  );
}
