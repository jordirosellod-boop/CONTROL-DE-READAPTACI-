"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import { SUPABASE_KEY, SUPABASE_URL } from "./supabase/env";
import { bool, dbError, int, list, num, str, type FormState } from "./form";
import { todayISO, type ParamsExercici } from "./calc";
import { buscaAPlantilla } from "./plantilla";
import { filaWellness } from "./wellness";

/** Client de Supabase amb sessió verificada. Cada acció es reautoritza. */
async function authed() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) redirect("/login");
  return supabase;
}

const playerPath = (id: string) => `/jugadors/${id}`;
/** Afegeix el codi d'avís (?ok=...) que la pàgina de destí mostrarà com a avís flotant. */
const ambAvis = (path: string, codi: string) => `${path}${path.includes("?") ? "&" : "?"}ok=${codi}`;
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
  // El projecte de Supabase es pot compartir amb altres apps: només hi entren els readaptadors autoritzats.
  const { data: staff } = await supabase.rpc("ra_is_staff");
  if (!staff) {
    await supabase.auth.signOut();
    return { error: "Aquest usuari no té accés a l'app de readaptació." };
  }
  const next = str(fd, "next");
  redirect(next && next.startsWith("/") && !next.startsWith("//") ? next : "/");
}

export async function changePassword(_: FormState, fd: FormData): Promise<FormState> {
  const supabase = await authed();
  const nova = (fd.get("password") as string) ?? "";
  const repetida = (fd.get("password2") as string) ?? "";
  if (nova.length < 8) return { error: "La contrasenya ha de tenir almenys 8 caràcters." };
  if (nova !== repetida) return { error: "Les dues contrasenyes no coincideixen." };
  const { error } = await supabase.auth.updateUser({ password: nova });
  if (error) return { error: `No s'ha pogut canviar: ${error.message}` };
  return ok("Contrasenya canviada. La propera vegada entra amb la nova.");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

// ---------------------------------------------------------------------------
// Avisos (notificacions push)
// ---------------------------------------------------------------------------

export async function guardaSubscripcio(sub: { endpoint: string; p256dh: string; auth: string }): Promise<{ error?: string }> {
  const supabase = await authed();
  const { data } = await supabase.auth.getClaims();
  const email = String(data?.claims?.email ?? "").toLowerCase();
  if (!email || !sub.endpoint.startsWith("https://") || !sub.p256dh || !sub.auth) return { error: "Subscripció no vàlida" };
  const { error } = await supabase.from("ra_push_subs").upsert({ endpoint: sub.endpoint, email, p256dh: sub.p256dh, auth: sub.auth });
  return error ? { error: error.message } : {};
}

export async function esborraSubscripcio(endpoint: string): Promise<void> {
  const supabase = await authed();
  await supabase.from("ra_push_subs").delete().eq("endpoint", endpoint);
}

export async function provaAvis(): Promise<{ error?: string; enviats?: number }> {
  const supabase = await authed();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return { error: "Sessió caducada" };
  try {
    const r = await fetch(`${SUPABASE_URL}/functions/v1/ra-avisos`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_KEY, "Content-Type": "application/json" },
      body: "{}",
    });
    const cos = (await r.json()) as { enviats?: number; error?: string };
    return r.ok ? { enviats: cos.enviats ?? 0 } : { error: cos.error ?? `Error ${r.status}` };
  } catch {
    return { error: "No s'ha pogut connectar" };
  }
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
    foto_url: str(fd, "foto_url"),
    dorsal: int(fd, "dorsal"),
    equip: str(fd, "equip"),
  };
  if (!row.nom) return { error: "El nom és obligatori." };
  if (row.foto_url && !/^https:\/\//.test(row.foto_url)) return { error: "L'enllaç de la foto ha de començar per https://" };
  // Si el nom coincideix amb un jugador de la plantilla del club, completa foto, dorsal, equip i posició.
  const web = buscaAPlantilla(row.nom, row.cognoms);
  if (web) {
    row.nom = web.nom;
    row.cognoms = web.cognoms;
    row.foto_url ??= web.foto;
    row.dorsal ??= web.dorsal;
    row.equip ??= web.equip;
    row.posicio ??= web.posicio;
  }
  const q = id ? supabase.from("ra_players").update(row).eq("id", id).select("id").single() : supabase.from("ra_players").insert(row).select("id").single();
  const { data, error } = await q;
  if (error) return { error: dbError(error) };
  revalidatePath("/");
  redirect(ambAvis(playerPath(data.id), "jugador"));
}

/** Canvia l'enllaç del formulari diari dels jugadors (l'antic deixa de funcionar). */
export async function nouFormulari(): Promise<{ codi?: string; error?: string }> {
  const supabase = await authed();
  const { data, error } = await supabase.rpc("ra_formulari_token", { p_nou: true });
  if (error || typeof data !== "string") return { error: dbError(error) };
  return { codi: data };
}

export async function setPlayerArchived(id: string, arxivat: boolean): Promise<FormState> {
  const supabase = await authed();
  const { error } = await supabase.from("ra_players").update({ arxivat }).eq("id", id);
  if (error) return { error: dbError(error) };
  revalidatePath("/");
  revalidatePath(playerPath(id));
  return ok(arxivat ? "Jugador arxivat" : "Jugador recuperat");
}

export async function deletePlayer(id: string): Promise<FormState> {
  const supabase = await authed();
  const { error } = await supabase.from("ra_players").delete().eq("id", id);
  if (error) return { error: dbError(error) };
  revalidatePath("/");
  redirect(ambAvis("/", "jugador-eliminat"));
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
    fase: int(fd, "fase"),
    data_prevista: str(fd, "data_prevista"),
    notes: str(fd, "notes"),
  };
  if (!row.diagnostic || !row.data_lesio) return { error: "El diagnòstic i la data de la lesió són obligatoris." };
  if (row.data_cirurgia && row.data_cirurgia < row.data_lesio) return { error: "La data de cirurgia no pot ser anterior a la lesió." };
  if (row.data_alta && row.data_alta < row.data_lesio) return { error: "La data d'alta no pot ser anterior a la lesió." };
  const { error } = injuryId ? await supabase.from("ra_injuries").update(row).eq("id", injuryId) : await supabase.from("ra_injuries").insert(row);
  if (error) return { error: dbError(error) };
  revalidatePath("/");
  revalidatePath(playerPath(playerId));
  redirect(ambAvis(`${playerPath(playerId)}?tab=lesions`, "lesio"));
}

/** Canvia la fase del camí de retorn al joc (des de la línia de temps de la fitxa). */
export async function setInjuryFase(playerId: string, injuryId: string, fase: number): Promise<FormState> {
  const supabase = await authed();
  if (!(fase >= 1 && fase <= 5)) return { error: "Fase no vàlida." };
  const { error } = await supabase.from("ra_injuries").update({ fase }).eq("id", injuryId);
  if (error) return { error: dbError(error) };
  revalidatePath("/");
  revalidatePath(playerPath(playerId));
  return ok("Fase actualitzada");
}

export async function deleteInjury(playerId: string, injuryId: string): Promise<FormState> {
  const supabase = await authed();
  const { error } = await supabase.from("ra_injuries").delete().eq("id", injuryId);
  if (error) return { error: dbError(error) };
  revalidatePath(playerPath(playerId));
  redirect(ambAvis(`${playerPath(playerId)}?tab=lesions`, "lesio-eliminada"));
}

// ---------------------------------------------------------------------------
// Wellness
// ---------------------------------------------------------------------------

export async function saveWellness(playerId: string, _: FormState, fd: FormData): Promise<FormState> {
  const supabase = await authed();
  const res = filaWellness(playerId, fd);
  if (res.error !== undefined) return { error: res.error };
  const row = res.row;
  const { error } = await supabase.from("ra_wellness_entries").upsert(row, { onConflict: "player_id,data" });
  if (error) return { error: dbError(error) };
  revalidatePath("/");
  revalidatePath(playerPath(playerId));
  redirect(ambAvis(str(fd, "tornar") === "dashboard" ? "/" : `${playerPath(playerId)}?tab=wellness`, "wellness"));
}

export async function deleteWellness(playerId: string, id: string): Promise<FormState> {
  const supabase = await authed();
  const { error } = await supabase.from("ra_wellness_entries").delete().eq("id", id);
  if (error) return { error: dbError(error) };
  revalidatePath("/");
  revalidatePath(playerPath(playerId));
  return ok("Eliminat");
}

// ---------------------------------------------------------------------------
// Imatges dels exercicis
// ---------------------------------------------------------------------------

type Supa = Awaited<ReturnType<typeof authed>>;
const MAX_IMATGE = 3 * 1024 * 1024;

/**
 * Llegeix la imatge del formulari (ja reduïda al mòbil) i la puja a l'emmagatzematge.
 * Retorna `undefined` si no hi ha canvis, `{ url: null }` si s'ha tret i `{ url }` si n'hi ha una de nova.
 */
async function imatgeDelFormulari(supabase: Supa, fd: FormData): Promise<{ url: string | null; error?: string } | undefined> {
  const dades = str(fd, "imatge_data");
  if (!dades) return bool(fd, "treure_imatge") ? { url: null } : undefined;
  const m = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(dades);
  if (!m) return { url: null, error: "La imatge no és vàlida." };
  const bytes = Buffer.from(m[2], "base64");
  if (bytes.length > MAX_IMATGE) return { url: null, error: "La imatge és massa gran (màxim 3 MB)." };
  const ext = m[1] === "jpeg" ? "jpg" : m[1];
  const cami = `exercicis/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("ra-imatges").upload(cami, bytes, { contentType: `image/${m[1]}`, cacheControl: "31536000" });
  if (error) return { url: null, error: `No s'ha pogut pujar la imatge: ${error.message}` };
  return { url: supabase.storage.from("ra-imatges").getPublicUrl(cami).data.publicUrl };
}

// ---------------------------------------------------------------------------
// Biblioteca d'exercicis
// ---------------------------------------------------------------------------

export async function saveExercise(id: string | null, _: FormState, fd: FormData): Promise<FormState> {
  const supabase = await authed();
  const row: Record<string, string | null> = { nom: str(fd, "nom") ?? "", categoria: str(fd, "categoria"), descripcio: str(fd, "descripcio") };
  if (!row.nom) return { error: "El nom és obligatori." };
  const img = await imatgeDelFormulari(supabase, fd);
  if (img?.error) return { error: img.error };
  if (img) row.imatge_url = img.url;
  const { error } = id ? await supabase.from("ra_exercises").update(row).eq("id", id) : await supabase.from("ra_exercises").insert(row);
  if (error) return { error: dbError(error) };
  revalidatePath("/exercicis");
  if (id) redirect(ambAvis("/exercicis", "exercici"));
  return ok(`«${row.nom}» afegit a la biblioteca`);
}

export async function deleteExercise(id: string): Promise<FormState> {
  const supabase = await authed();
  const { error } = await supabase.from("ra_exercises").delete().eq("id", id);
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
    .from("ra_sessions")
    .insert({ player_id: playerId, injury_id: str(fd, "injury_id"), data: str(fd, "data") ?? todayISO(), nom: str(fd, "nom") })
    .select("id")
    .single();
  if (error) return { error: dbError(error) };
  const plantillaId = str(fd, "plantilla_id");
  if (plantillaId) {
    const { data: pl, error: e2 } = await supabase.from("ra_plantilles").select("nom, durada_min, exercicis").eq("id", plantillaId).single();
    if (e2 || !pl) return { error: dbError(e2) };
    const files = ((pl.exercicis ?? []) as Record<string, unknown>[]).map((e, ordre) => ({
      ...Object.fromEntries(CAMPS_PLANTILLA.map((k) => [k, e[k] ?? null])),
      session_id: data.id,
      ordre,
    }));
    if (files.length) {
      const { error: e3 } = await supabase.from("ra_session_exercises").insert(files);
      if (e3) return { error: dbError(e3) };
    }
    await supabase.from("ra_sessions").update({ nom: str(fd, "nom") ?? pl.nom, durada_min: pl.durada_min }).eq("id", data.id);
  }
  revalidatePath(playerPath(playerId));
  revalidatePath("/agenda");
  redirect(ambAvis(sessionPath(playerId, data.id), plantillaId ? "sessio-plantilla" : "sessio"));
}

export async function updateSession(playerId: string, sessionId: string, _: FormState, fd: FormData): Promise<FormState> {
  const supabase = await authed();
  const { data: abans } = await supabase.from("ra_sessions").select("completada").eq("id", sessionId).maybeSingle();
  const completada = bool(fd, "completada");
  const { error } = await supabase
    .from("ra_sessions")
    .update({
      data: str(fd, "data") ?? todayISO(),
      nom: str(fd, "nom"),
      completada,
      rpe: num(fd, "rpe"),
      durada_min: int(fd, "durada_min"),
      notes: str(fd, "notes"),
    })
    .eq("id", sessionId);
  if (error) return { error: dbError(error) };
  revalidatePath("/");
  revalidatePath(playerPath(playerId));
  revalidatePath(sessionPath(playerId, sessionId));
  // En acabar la sessió, es mostra directament la fitxa en PDF
  if (completada && abans && !abans.completada) redirect(ambAvis(`${sessionPath(playerId, sessionId)}/pdf`, "sessio-acabada"));
  return ok("Sessió desada");
}

export async function deleteSession(playerId: string, sessionId: string): Promise<FormState> {
  const supabase = await authed();
  const { error } = await supabase.from("ra_sessions").delete().eq("id", sessionId);
  if (error) return { error: dbError(error) };
  revalidatePath("/");
  revalidatePath(playerPath(playerId));
  redirect(ambAvis(`${playerPath(playerId)}?tab=sessions`, "sessio-eliminada"));
}

/** Crea una còpia de la sessió per avui (mateixos exercicis i treball de camp, sense completar). */
export async function duplicateSession(playerId: string, sessionId: string): Promise<FormState> {
  const supabase = await authed();
  const { data: s, error: e1 } = await supabase.from("ra_sessions").select("*, session_exercises:ra_session_exercises(*), field_work:ra_field_work(*)").eq("id", sessionId).single();
  if (e1 || !s) return { error: dbError(e1) };

  const { data: created, error: e2 } = await supabase
    .from("ra_sessions")
    .insert({ player_id: s.player_id, injury_id: s.injury_id, data: todayISO(), nom: s.nom, durada_min: s.durada_min })
    .select("id")
    .single();
  if (e2) return { error: dbError(e2) };

  type Row = Record<string, unknown>;
  const OMIT = new Set(["id", "session_id", "owner_id", "created_at"]);
  const strip = (r: Row) => Object.fromEntries(Object.entries(r).filter(([k]) => !OMIT.has(k)));
  const exercises = ((s.session_exercises ?? []) as Row[]).map((e) => ({ ...strip(e), session_id: created.id }));
  if (exercises.length) {
    const { error } = await supabase.from("ra_session_exercises").insert(exercises);
    if (error) return { error: dbError(error) };
  }
  const fw = (Array.isArray(s.field_work) ? s.field_work[0] : s.field_work) as Row | null;
  if (fw) {
    const { error } = await supabase.from("ra_field_work").insert({ ...strip(fw), session_id: created.id });
    if (error) return { error: dbError(error) };
  }
  revalidatePath(playerPath(playerId));
  redirect(ambAvis(sessionPath(playerId, created.id), "duplicada"));
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
  let video: string | null = null;
  const img = await imatgeDelFormulari(supabase, fd);
  if (img?.error) return { error: img.error };
  let imatge = img?.url ?? null;

  if (exerciseId) {
    const { data: ex, error } = await supabase.from("ra_exercises").select("nom, video_url, imatge_url").eq("id", exerciseId).single();
    if (error) return { error: dbError(error) };
    nom = nom ?? ex.nom;
    video = ex.video_url;
    imatge = imatge ?? ex.imatge_url;
  } else if (nom && bool(fd, "guardar_biblioteca")) {
    const { data: ex, error } = await supabase.from("ra_exercises").insert({ nom, imatge_url: imatge }).select("id").single();
    if (error) return { error: dbError(error) };
    exerciseId = ex.id;
  }
  if (!nom) return { error: "Tria un exercici de la biblioteca o escriu-ne el nom." };

  const { count } = await supabase.from("ra_session_exercises").select("id", { count: "exact", head: true }).eq("session_id", sessionId);
  const { error } = await supabase
    .from("ra_session_exercises")
    .insert({ session_id: sessionId, exercise_id: exerciseId, nom, video_url: video, imatge_url: imatge, ordre: count ?? 0, ...exerciseFields(fd) });
  if (error) return { error: dbError(error) };
  revalidatePath(sessionPath(playerId, sessionId));
  return ok(`«${nom}» afegit`);
}

export async function updateSessionExercise(playerId: string, sessionId: string, id: string, _: FormState, fd: FormData): Promise<FormState> {
  const supabase = await authed();
  const img = await imatgeDelFormulari(supabase, fd);
  if (img?.error) return { error: img.error };
  const { error } = await supabase
    .from("ra_session_exercises")
    .update({ nom: str(fd, "nom") ?? undefined, ...(img ? { imatge_url: img.url } : {}), ...exerciseFields(fd) })
    .eq("id", id);
  if (error) return { error: dbError(error) };
  revalidatePath(sessionPath(playerId, sessionId));
  return ok("Desat");
}

/** Aplica el suggeriment de progressió (només els camps de volum i càrrega). */
export async function aplicaProgressio(playerId: string, sessionId: string, id: string, canvis: Partial<ParamsExercici>): Promise<FormState> {
  const supabase = await authed();
  const net: Partial<ParamsExercici> = {};
  if (typeof canvis.carrega === "string") net.carrega = canvis.carrega.slice(0, 100);
  for (const k of ["series", "repeticions", "temps_s"] as const) {
    const v = canvis[k];
    if (typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= 86400) net[k] = v;
  }
  if (Object.keys(net).length === 0) return { error: "Res a aplicar." };
  const { error } = await supabase.from("ra_session_exercises").update(net).eq("id", id).eq("session_id", sessionId);
  if (error) return { error: dbError(error) };
  revalidatePath(sessionPath(playerId, sessionId));
  return ok("Progressió aplicada");
}

// ---------------------------------------------------------------------------
// Plantilles de sessió
// ---------------------------------------------------------------------------

const CAMPS_PLANTILLA = ["nom", "exercise_id", "imatge_url", "video_url", "series", "repeticions", "temps_s", "carrega", "descans_s", "rpe", "notes"] as const;

/** Desa els exercicis d'una sessió com a plantilla reutilitzable. */
export async function desaPlantilla(sessionId: string, nom: string): Promise<{ error?: string }> {
  const supabase = await authed();
  const net = nom.trim().slice(0, 120);
  if (!net) return { error: "Posa un nom a la plantilla." };
  const { data: s, error: e1 } = await supabase
    .from("ra_sessions")
    .select("durada_min, session_exercises:ra_session_exercises(*)")
    .eq("id", sessionId)
    .order("ordre", { referencedTable: "session_exercises" })
    .single();
  if (e1 || !s) return { error: dbError(e1) };
  const exercicis = ((s.session_exercises ?? []) as Record<string, unknown>[]).map((e) => Object.fromEntries(CAMPS_PLANTILLA.map((k) => [k, e[k] ?? null])));
  if (exercicis.length === 0) return { error: "La sessió no té exercicis." };
  const { error } = await supabase.from("ra_plantilles").insert({ nom: net, durada_min: s.durada_min, exercicis });
  if (error) return { error: dbError(error) };
  revalidatePath("/exercicis");
  return {};
}

export async function deletePlantilla(id: string): Promise<FormState> {
  const supabase = await authed();
  const { error } = await supabase.from("ra_plantilles").delete().eq("id", id);
  if (error) return { error: dbError(error) };
  revalidatePath("/exercicis");
  return ok("Plantilla eliminada");
}

export async function deleteSessionExercise(playerId: string, sessionId: string, id: string): Promise<FormState> {
  const supabase = await authed();
  const { error } = await supabase.from("ra_session_exercises").delete().eq("id", id);
  if (error) return { error: dbError(error) };
  revalidatePath(sessionPath(playerId, sessionId));
  return ok("Eliminat");
}

/** Mou un exercici amunt (-1) o avall (+1) dins la sessió. */
export async function moveSessionExercise(playerId: string, sessionId: string, id: string, dir: -1 | 1): Promise<FormState> {
  const supabase = await authed();
  const { data: rows, error } = await supabase.from("ra_session_exercises").select("id, ordre").eq("session_id", sessionId).order("ordre").order("created_at");
  if (error || !rows) return { error: dbError(error) };
  const i = rows.findIndex((r) => r.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= rows.length) return undefined;
  [rows[i], rows[j]] = [rows[j], rows[i]];
  for (const [ordre, r] of rows.entries()) {
    const { error: e } = await supabase.from("ra_session_exercises").update({ ordre }).eq("id", r.id);
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
  const { error } = await supabase.from("ra_field_work").upsert(row, { onConflict: "session_id" });
  if (error) return { error: dbError(error) };
  revalidatePath(playerPath(playerId));
  revalidatePath(sessionPath(playerId, sessionId));
  return ok("Treball de camp desat");
}

export async function deleteFieldWork(playerId: string, sessionId: string): Promise<FormState> {
  const supabase = await authed();
  const { error } = await supabase.from("ra_field_work").delete().eq("session_id", sessionId);
  if (error) return { error: dbError(error) };
  revalidatePath(sessionPath(playerId, sessionId));
  return ok("Eliminat");
}

// ---------------------------------------------------------------------------
// Tractaments a camilla
// ---------------------------------------------------------------------------

export async function saveTreatment(playerId: string, id: string | null, _: FormState, fd: FormData): Promise<FormState> {
  const supabase = await authed();
  const row = {
    player_id: playerId,
    injury_id: str(fd, "injury_id"),
    data: str(fd, "data") ?? todayISO(),
    durada_min: int(fd, "durada_min"),
    tecniques: list(fd, "tecniques"),
    zones: list(fd, "zones"),
    dolor_abans: int(fd, "dolor_abans"),
    dolor_despres: int(fd, "dolor_despres"),
    notes: str(fd, "notes"),
  };
  if (!row.tecniques.length && !row.notes) return { error: "Marca almenys una tècnica o escriu una observació." };
  if (id) delete (row as Partial<typeof row>).injury_id; // en editar es manté la lesió original
  const { error } = id ? await supabase.from("ra_treatments").update(row).eq("id", id) : await supabase.from("ra_treatments").insert(row);
  if (error) {
    if (error.code === "42P01" || error.code === "PGRST205") return { error: "Falta crear la taula de tractaments a Supabase (executa el SQL de tractaments)." };
    return { error: dbError(error) };
  }
  revalidatePath(playerPath(playerId));
  redirect(ambAvis(`${playerPath(playerId)}?tab=tractament`, "tractament"));
}

export async function deleteTreatment(playerId: string, id: string): Promise<FormState> {
  const supabase = await authed();
  const { error } = await supabase.from("ra_treatments").delete().eq("id", id);
  if (error) return { error: dbError(error) };
  revalidatePath(playerPath(playerId));
  redirect(ambAvis(`${playerPath(playerId)}?tab=tractament`, "tractament-eliminat"));
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
  const { error } = await supabase.from("ra_tests").insert(rows);
  if (error) return { error: dbError(error) };
  revalidatePath("/");
  revalidatePath(playerPath(playerId));
  redirect(ambAvis(`${playerPath(playerId)}?tab=tests`, "test"));
}

export async function deleteTest(playerId: string, id: string): Promise<FormState> {
  const supabase = await authed();
  const { error } = await supabase.from("ra_tests").delete().eq("id", id);
  if (error) return { error: dbError(error) };
  revalidatePath(playerPath(playerId));
  return ok("Eliminat");
}
