import "server-only";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "./supabase/server";
import type { Exercise, FieldWork, Injury, PhysicalTest, Player, Session, SessionExercise, Treatment, WellnessEntry } from "./types";

/** Client amb usuari verificat (redirigeix a /login si no n'hi ha). */
export const getDb = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) redirect("/login");
  // Usuari d'una altra app del mateix projecte de Supabase: no és readaptador.
  const { data: staff } = await supabase.rpc("ra_is_staff");
  if (!staff) redirect("/sense-acces");
  return { supabase, email: (data.claims.email as string | undefined) ?? "" };
});

function unwrap<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

export type SessionWithField = Session & { field_work: FieldWork | null };

const one = <T,>(v: T | T[] | null): T | null => (Array.isArray(v) ? (v[0] ?? null) : v);

export async function getPlayer(id: string) {
  const { supabase } = await getDb();
  const res = await supabase.from("ra_players").select("*").eq("id", id).maybeSingle();
  const player = unwrap(res) as Player | null;
  if (!player) notFound();
  return player;
}

export async function getPlayerBundle(id: string) {
  const { supabase } = await getDb();
  const [player, injuries, wellness, sessions, tests, treatments] = await Promise.all([
    getPlayer(id),
    supabase.from("ra_injuries").select("*").eq("player_id", id).order("data_lesio", { ascending: false }),
    supabase.from("ra_wellness_entries").select("*").eq("player_id", id).order("data", { ascending: false }).limit(120),
    supabase.from("ra_sessions").select("*, field_work:ra_field_work(*)").eq("player_id", id).order("data", { ascending: false }).order("created_at", { ascending: false }),
    supabase.from("ra_tests").select("*").eq("player_id", id).order("data").order("created_at"),
    supabase.from("ra_treatments").select("*").eq("player_id", id).order("data", { ascending: false }).order("created_at", { ascending: false }),
  ]);
  const sessionRows = (unwrap(sessions) as (Session & { field_work: FieldWork | FieldWork[] | null })[]).map((s) => ({ ...s, field_work: one(s.field_work) }));
  return {
    player,
    injuries: unwrap(injuries) as Injury[],
    wellness: unwrap(wellness) as WellnessEntry[],
    sessions: sessionRows as SessionWithField[],
    tests: unwrap(tests) as PhysicalTest[],
    // Si encara no s'ha creat la taula de tractaments, la resta de la fitxa continua funcionant.
    treatments: (treatments.error ? [] : treatments.data) as Treatment[],
    treatmentsReady: !treatments.error,
  };
}

export async function getTreatment(id: string) {
  const { supabase } = await getDb();
  const t = unwrap(await supabase.from("ra_treatments").select("*").eq("id", id).maybeSingle()) as Treatment | null;
  if (!t) notFound();
  return t;
}

export async function getSessionDetail(sessionId: string) {
  const { supabase } = await getDb();
  const res = await supabase
    .from("ra_sessions")
    .select("*, field_work:ra_field_work(*), session_exercises:ra_session_exercises(*)")
    .eq("id", sessionId)
    .order("ordre", { referencedTable: "session_exercises" })
    .order("created_at", { referencedTable: "session_exercises" })
    .maybeSingle();
  const s = unwrap(res) as (Session & { field_work: FieldWork | FieldWork[] | null; session_exercises: SessionExercise[] }) | null;
  if (!s) notFound();
  return { ...s, field_work: one(s.field_work) };
}

export async function getExercises() {
  const { supabase } = await getDb();
  return unwrap(await supabase.from("ra_exercises").select("*").order("nom")) as Exercise[];
}

export async function getInjury(id: string) {
  const { supabase } = await getDb();
  const injury = unwrap(await supabase.from("ra_injuries").select("*").eq("id", id).maybeSingle()) as Injury | null;
  if (!injury) notFound();
  return injury;
}

export async function getWellnessFor(playerId: string, date: string) {
  const { supabase } = await getDb();
  return unwrap(await supabase.from("ra_wellness_entries").select("*").eq("player_id", playerId).eq("data", date).maybeSingle()) as WellnessEntry | null;
}

/** Dades per al panell: jugadors actius amb lesions, wellness recent i sessions. */
export async function getDashboard(today: string, since: string) {
  const { supabase } = await getDb();
  const [players, wellness, sessions, tests] = await Promise.all([
    supabase.from("ra_players").select("*, injuries:ra_injuries(*)").eq("arxivat", false).order("nom"),
    supabase.from("ra_wellness_entries").select("*").gte("data", since).lte("data", today).order("data"),
    supabase.from("ra_sessions").select("id, player_id, injury_id, data, completada, rpe, durada_min, field_work:ra_field_work(minuts_carrera, distancia_m, esprints)"),
    supabase.from("ra_tests").select("player_id, nom, costat, valor, data, es_baseline, millor_si, unitat, tipus, created_at"),
  ]);
  return {
    players: unwrap(players) as (Player & { injuries: Injury[] })[],
    wellness: unwrap(wellness) as WellnessEntry[],
    sessions: (unwrap(sessions) as (Pick<Session, "id" | "player_id" | "injury_id" | "data" | "completada" | "rpe" | "durada_min"> & {
      field_work: Pick<FieldWork, "minuts_carrera" | "distancia_m" | "esprints"> | Pick<FieldWork, "minuts_carrera" | "distancia_m" | "esprints">[] | null;
    })[]).map((s) => ({ ...s, field_work: one(s.field_work) })),
    tests: unwrap(tests) as (PhysicalTest & { created_at: string })[],
  };
}

/** Lesió activa (la més recent sense alta). */
export function activeInjury(injuries: Injury[]): Injury | null {
  return [...injuries].filter((i) => i.activa).sort((a, b) => b.data_lesio.localeCompare(a.data_lesio))[0] ?? null;
}
