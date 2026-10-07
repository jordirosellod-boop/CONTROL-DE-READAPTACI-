"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import { bool, dbError, int, list, num, str, type FormState } from "./form";
import { todayISO } from "./calc";

/** Client de Supabase amb sessió verificada. Cada acció es reautoritza. */
async function authed() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) redirect("/login");
  return supabase;
}

const playerPath = (id: string) => `/jugadors/${id}`;
const ok = (msg: string): FormState => ({ ok: msg, ts: Date.now() });

// ---------------------------------------------------------------------------
// Autenticació
// ---------------------------------------------------------------------------

export async function login(_: FormState, fd: FormData): Promise<FormState> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: str(fd, "email") ?? "",
    password: (fd.get("password") as string) ?? "",
  });
  if (error) return { error: "Correu o contrasenya incorrectes." };
  const next = str(fd, "next");
  redirect(next && next.startsWith("/") && !next.startsWith("//") ? next : "/");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

// ---------------------------------------------------------------------------
// Jugadors
// ---------------------------------------------------------------------------

export async function savePlayer(id: string | null, _: FormState, fd: FormData): Promise<FormState> {
  const supabase = await authed();
  const row = {
    nom: str(fd, "nom") ?? "",
    cognoms: str(fd, "cognoms") ?? "",
    edat: int(fd, "edat"),
    posicio: str(fd, "posicio"),
    cama_dominant: str(fd, "cama_dominant"),
    historial_lesions: str(fd, "historial_lesions"),
  };
  if (!row.nom) return { error: "El nom és obligatori." };
  const q = id ? supabase.from("players").update(row).eq("id", id).select("id").single() : supabase.from("players").insert(row).select("id").single();
  const { data, error } = await q;
  if (error) return { error: dbError(error) };
  revalidatePath("/");
  redirect(playerPath(data.id));
}

export async function setPlayerArchived(id: string, arxivat: boolean): Promise<FormState> {
  const supabase = await authed();
  const { error } = await supabase.from("players").update({ arxivat }).eq("id", id);
  if (error) return { error: dbError(error) };
  revalidatePath("/");
  revalidatePath(playerPath(id));
  return ok(arxivat ? "Jugador arxivat" : "Jugador recuperat");
}

export async function deletePlayer(id: string): Promise<FormState> {
  const supabase = await authed();
  const { error } = await supabase.from("players").delete().eq("id", id);
  if (error) return { error: dbError(error) };
  revalidatePath("/");
  redirect("/");
}

// ---------------------------------------------------------------------------
// Lesions
// ---------------------------------------------------------------------------

export async function saveInjury(playerId: string, injuryId: string | null, _: FormState, fd: FormData): Promise<FormState> {
  const supabase = await authed();
  const row = {
    player_id: playerId,
    diagnostic: str(fd, "diagnostic") ?? "",
    categoria: str(fd, "categoria"),
    zona: str(fd, "zona"),
    costat: str(fd, "costat"),
    data_lesio: str(fd, "data_lesio"),
    data_cirurgia: str(fd, "data_cirurgia"),
    data_alta: str(fd, "data_alta"),
    notes: str(fd, "notes"),
  };
  if (!row.diagnostic || !row.data_lesio) return { error: "El diagnòstic i la data de la lesió són obligatoris." };
  if (row.data_cirurgia && row.data_cirurgia < row.data_lesio) return { error: "La data de cirurgia no pot ser anterior a la lesió." };
  if (row.data_alta && row.data_alta < row.data_lesio) return { error: "La data d'alta no pot ser anterior a la lesió." };
  const { error } = injuryId ? await supabase.from("injuries").update(row).eq("id", injuryId) : await supabase.from("injuries").insert(row);
  if (error) return { error: dbError(error) };
  revalidatePath("/");
  revalidatePath(playerPath(playerId));
  redirect(`${playerPath(playerId)}?tab=lesions`);
}

export async function deleteInjury(playerId: string, injuryId: string): Promise<FormState> {
  const supabase = await authed();
  const { error } = await supabase.from("injuries").delete().eq("id", injuryId);
  if (error) return { error: dbError(error) };
  revalidatePath(playerPath(playerId));
  redirect(`${playerPath(playerId)}?tab=lesions`);
}

// ---------------------------------------------------------------------------
// Wellness
// ---------------------------------------------------------------------------

export async function saveWellness(playerId: string, _: FormState, fd: FormData): Promise<FormState> {
  const supabase = await authed();
  const row = {
    player_id: playerId,
    data: str(fd, "data") ?? todayISO(),
    son_qualitat: int(fd, "son_qualitat"),
    son_hores: num(fd, "son_hores"),
    fatiga: int(fd, "fatiga"),
    estres: int(fd, "estres"),
    estat_anim: int(fd, "estat_anim"),
    dolor_eva: int(fd, "dolor_eva") ?? 0,
    dolor_zones: list(fd, "dolor_zones"),
    recuperacio: int(fd, "recuperacio"),
    comentari: str(fd, "comentari"),
  };
  if ([row.son_qualitat, row.fatiga, row.estres, row.estat_anim, row.recuperacio].some((v) => v == null)) {
    return { error: "Respon totes les escales 1–5." };
  }
  const { error } = await supabase.from("wellness_entries").upsert(row, { onConflict: "player_id,data" });
  if (error) return { error: dbError(error) };
  revalidatePath("/");
  revalidatePath(playerPath(playerId));
  redirect(str(fd, "tornar") === "dashboard" ? "/" : `${playerPath(playerId)}?tab=wellness`);
}

export async function deleteWellness(playerId: string, id: string): Promise<FormState> {
  const supabase = await authed();
  const { error } = await supabase.from("wellness_entries").delete().eq("id", id);
  if (error) return { error: dbError(error) };
  revalidatePath("/");
  revalidatePath(playerPath(playerId));
  return ok("Eliminat");
}

// ---------------------------------------------------------------------------
// Biblioteca d'exercicis
// ---------------------------------------------------------------------------

export async function saveExercise(id: string | null, _: FormState, fd: FormData): Promise<FormState> {
  const supabase = await authed();
  const row = { nom: str(fd, "nom") ?? "", categoria: str(fd, "categoria"), video_url: str(fd, "video_url"), descripcio: str(fd, "descripcio") };
  if (!row.nom) return { error: "El nom és obligatori." };
  const { error } = id ? await supabase.from("exercises").update(row).eq("id", id) : await supabase.from("exercises").insert(row);
  if (error) return { error: dbError(error) };
  revalidatePath("/exercicis");
  if (id) redirect("/exercicis");
  return ok(`«${row.nom}» afegit a la biblioteca`);
}

export async function deleteExercise(id: string): Promise<FormState> {
  const supabase = await authed();
  const { error } = await supabase.from("exercises").delete().eq("id", id);
  if (error) return { error: dbError(error) };
  revalidatePath("/exercicis");
  return ok("Eliminat");
}

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------

const sessionPath = (playerId: string, sessionId: string) => `${playerPath(playerId)}/sessions/${sessionId}`;

export async function createSession(playerId: string, _: FormState, fd: FormData): Promise<FormState> {
  const supabase = await authed();
  const { data, error } = await supabase
    .from("sessions")
    .insert({ player_id: playerId, injury_id: str(fd, "injury_id"), data: str(fd, "data") ?? todayISO(), nom: str(fd, "nom") })
    .select("id")
    .single();
  if (error) return { error: dbError(error) };
  revalidatePath(playerPath(playerId));
  redirect(sessionPath(playerId, data.id));
}

export async function updateSession(playerId: string, sessionId: string, _: FormState, fd: FormData): Promise<FormState> {
  const supabase = await authed();
  const { error } = await supabase
    .from("sessions")
    .update({
      data: str(fd, "data") ?? todayISO(),
      nom: str(fd, "nom"),
      completada: bool(fd, "completada"),
      rpe: num(fd, "rpe"),
      durada_min: int(fd, "durada_min"),
      notes: str(fd, "notes"),
    })
    .eq("id", sessionId);
  if (error) return { error: dbError(error) };
  revalidatePath("/");
  revalidatePath(playerPath(playerId));
  revalidatePath(sessionPath(playerId, sessionId));
  return ok("Sessió desada");
}

export async function deleteSession(playerId: string, sessionId: string): Promise<FormState> {
  const supabase = await authed();
  const { error } = await supabase.from("sessions").delete().eq("id", sessionId);
  if (error) return { error: dbError(error) };
  revalidatePath("/");
  revalidatePath(playerPath(playerId));
  redirect(`${playerPath(playerId)}?tab=sessions`);
}

/** Crea una còpia de la sessió per avui (mateixos exercicis i treball de camp, sense completar). */
export async function duplicateSession(playerId: string, sessionId: string): Promise<FormState> {
  const supabase = await authed();
  const { data: s, error: e1 } = await supabase.from("sessions").select("*, session_exercises(*), field_work(*)").eq("id", sessionId).single();
  if (e1 || !s) return { error: dbError(e1) };

  const { data: created, error: e2 } = await supabase
    .from("sessions")
    .insert({ player_id: s.player_id, injury_id: s.injury_id, data: todayISO(), nom: s.nom, durada_min: s.durada_min })
    .select("id")
    .single();
  if (e2) return { error: dbError(e2) };

  type Row = Record<string, unknown>;
  const OMIT = new Set(["id", "session_id", "owner_id", "created_at"]);
  const strip = (r: Row) => Object.fromEntries(Object.entries(r).filter(([k]) => !OMIT.has(k)));
  const exercises = ((s.session_exercises ?? []) as Row[]).map((e) => ({ ...strip(e), session_id: created.id }));
  if (exercises.length) {
    const { error } = await supabase.from("session_exercises").insert(exercises);
    if (error) return { error: dbError(error) };
  }
  const fw = (Array.isArray(s.field_work) ? s.field_work[0] : s.field_work) as Row | null;
  if (fw) {
    const { error } = await supabase.from("field_work").insert({ ...strip(fw), session_id: created.id });
    if (error) return { error: dbError(error) };
  }
  revalidatePath(playerPath(playerId));
  redirect(sessionPath(playerId, created.id));
}

function exerciseFields(fd: FormData) {
  return {
    series: int(fd, "series"),
    repeticions: int(fd, "repeticions"),
    temps_s: int(fd, "temps_s"),
    carrega: str(fd, "carrega"),
    descans_s: int(fd, "descans_s"),
    rpe: num(fd, "rpe"),
    notes: str(fd, "notes"),
  };
}

export async function addSessionExercise(playerId: string, sessionId: string, _: FormState, fd: FormData): Promise<FormState> {
  const supabase = await authed();
  let exerciseId = str(fd, "exercise_id");
  let nom = str(fd, "nom");
  let video = str(fd, "video_url");

  if (exerciseId) {
    const { data: ex, error } = await supabase.from("exercises").select("nom, video_url").eq("id", exerciseId).single();
    if (error) return { error: dbError(error) };
    nom = nom ?? ex.nom;
    video = video ?? ex.video_url;
  } else if (nom && bool(fd, "guardar_biblioteca")) {
    const { data: ex, error } = await supabase.from("exercises").insert({ nom, video_url: video }).select("id").single();
    if (error) return { error: dbError(error) };
    exerciseId = ex.id;
  }
  if (!nom) return { error: "Tria un exercici de la biblioteca o escriu-ne el nom." };

  const { count } = await supabase.from("session_exercises").select("id", { count: "exact", head: true }).eq("session_id", sessionId);
  const { error } = await supabase
    .from("session_exercises")
    .insert({ session_id: sessionId, exercise_id: exerciseId, nom, video_url: video, ordre: count ?? 0, ...exerciseFields(fd) });
  if (error) return { error: dbError(error) };
  revalidatePath(sessionPath(playerId, sessionId));
  return ok(`«${nom}» afegit`);
}

export async function updateSessionExercise(playerId: string, sessionId: string, id: string, _: FormState, fd: FormData): Promise<FormState> {
  const supabase = await authed();
  const { error } = await supabase
    .from("session_exercises")
    .update({ nom: str(fd, "nom") ?? undefined, video_url: str(fd, "video_url"), ...exerciseFields(fd) })
    .eq("id", id);
  if (error) return { error: dbError(error) };
  revalidatePath(sessionPath(playerId, sessionId));
  return ok("Desat");
}

export async function deleteSessionExercise(playerId: string, sessionId: string, id: string): Promise<FormState> {
  const supabase = await authed();
  const { error } = await supabase.from("session_exercises").delete().eq("id", id);
  if (error) return { error: dbError(error) };
  revalidatePath(sessionPath(playerId, sessionId));
  return ok("Eliminat");
}

/** Mou un exercici amunt (-1) o avall (+1) dins la sessió. */
export async function moveSessionExercise(playerId: string, sessionId: string, id: string, dir: -1 | 1): Promise<FormState> {
  const supabase = await authed();
  const { data: rows, error } = await supabase.from("session_exercises").select("id, ordre").eq("session_id", sessionId).order("ordre").order("created_at");
  if (error || !rows) return { error: dbError(error) };
  const i = rows.findIndex((r) => r.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= rows.length) return undefined;
  [rows[i], rows[j]] = [rows[j], rows[i]];
  for (const [ordre, r] of rows.entries()) {
    const { error: e } = await supabase.from("session_exercises").update({ ordre }).eq("id", r.id);
    if (e) return { error: dbError(e) };
  }
  revalidatePath(sessionPath(playerId, sessionId));
  return undefined;
}

export async function saveFieldWork(playerId: string, sessionId: string, _: FormState, fd: FormData): Promise<FormState> {
  const supabase = await authed();
  const distKm = num(fd, "distancia_km");
  const row = {
    session_id: sessionId,
    minuts_carrera: num(fd, "minuts_carrera"),
    distancia_m: distKm == null ? null : Math.round(distKm * 1000),
    vel_max_kmh: num(fd, "vel_max_kmh"),
    vel_mitjana_kmh: num(fd, "vel_mitjana_kmh"),
    esprints: int(fd, "esprints"),
    acceleracions: int(fd, "acceleracions"),
    desacceleracions: int(fd, "desacceleracions"),
    canvis_direccio: int(fd, "canvis_direccio"),
    tipus_treball: str(fd, "tipus_treball"),
    notes: str(fd, "notes"),
  };
  const { error } = await supabase.from("field_work").upsert(row, { onConflict: "session_id" });
  if (error) return { error: dbError(error) };
  revalidatePath(playerPath(playerId));
  revalidatePath(sessionPath(playerId, sessionId));
  return ok("Treball de camp desat");
}

export async function deleteFieldWork(playerId: string, sessionId: string): Promise<FormState> {
  const supabase = await authed();
  const { error } = await supabase.from("field_work").delete().eq("session_id", sessionId);
  if (error) return { error: dbError(error) };
  revalidatePath(sessionPath(playerId, sessionId));
  return ok("Eliminat");
}

// ---------------------------------------------------------------------------
// Tests físics
// ---------------------------------------------------------------------------

/**
 * Desa un test. Es poden omplir alhora el valor bilateral i/o els dos costats;
 * es crea un registre per a cada valor informat.
 */
export async function saveTests(playerId: string, _: FormState, fd: FormData): Promise<FormState> {
  const supabase = await authed();
  const base = {
    player_id: playerId,
    injury_id: str(fd, "injury_id"),
    tipus: str(fd, "tipus"),
    nom: str(fd, "nom"),
    unitat: str(fd, "unitat"),
    millor_si: str(fd, "millor_si") ?? "mes",
    data: str(fd, "data") ?? todayISO(),
    es_baseline: bool(fd, "es_baseline"),
    notes: str(fd, "notes"),
  };
  if (!base.tipus || !base.nom) return { error: "Indica el tipus i el nom del test." };
  const rows = (["bilateral", "lesionat", "sa"] as const)
    .map((costat) => ({ costat, valor: num(fd, `valor_${costat}`) }))
    .filter((r) => r.valor != null)
    .map((r) => ({ ...base, ...r }));
  if (!rows.length) return { error: "Introdueix almenys un valor." };
  const { error } = await supabase.from("tests").insert(rows);
  if (error) return { error: dbError(error) };
  revalidatePath("/");
  revalidatePath(playerPath(playerId));
  redirect(`${playerPath(playerId)}?tab=tests`);
}

export async function deleteTest(playerId: string, id: string): Promise<FormState> {
  const supabase = await authed();
  const { error } = await supabase.from("tests").delete().eq("id", id);
  if (error) return { error: dbError(error) };
  revalidatePath(playerPath(playerId));
  return ok("Eliminat");
}
