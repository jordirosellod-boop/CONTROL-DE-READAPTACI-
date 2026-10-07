// Càlculs purs (sense accés a dades) per poder-los provar fàcilment.
import type { CostatTest, PhysicalTest, WellnessEntry } from "./types";

export const TIMEZONE = "Europe/Madrid";

/** Data d'avui (YYYY-MM-DD) a la zona horària de l'equip. */
export function todayISO(now: Date = new Date(), timeZone = TIMEZONE): string {
  // en-CA formata com YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

function toUTC(iso: string): number {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

export function daysBetween(from: string, to: string): number {
  return Math.round((toUTC(to) - toUTC(from)) / 86_400_000);
}

export function addDays(iso: string, days: number): string {
  return new Date(toUTC(iso) + days * 86_400_000).toISOString().slice(0, 10);
}

/** Dilluns de la setmana d'una data (YYYY-MM-DD). */
export function mondayOf(iso: string): string {
  const dow = new Date(toUTC(iso)).getUTCDay(); // 0 = diumenge
  return addDays(iso, -((dow + 6) % 7));
}

export function formatDate(iso: string | null | undefined, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("ca-ES", { ...opts, timeZone: "UTC" }).format(new Date(toUTC(iso)));
}

// ---------------------------------------------------------------------------
// Lesió
// ---------------------------------------------------------------------------

export interface TreatmentWeek {
  setmana: number;
  dies: number;
  referencia: "lesio" | "cirurgia";
}

/**
 * Setmana de tractament: es compta des de la cirurgia si n'hi ha, si no des de
 * la lesió. El dia 0 és la setmana 1.
 */
export function treatmentWeek(
  injury: { data_lesio: string; data_cirurgia: string | null; data_alta?: string | null },
  today: string,
): TreatmentWeek {
  const referencia = injury.data_cirurgia ? "cirurgia" : "lesio";
  const inici = injury.data_cirurgia ?? injury.data_lesio;
  const fi = injury.data_alta && injury.data_alta < today ? injury.data_alta : today;
  const dies = Math.max(0, daysBetween(inici, fi));
  return { setmana: Math.floor(dies / 7) + 1, dies, referencia };
}

// ---------------------------------------------------------------------------
// Wellness
// ---------------------------------------------------------------------------

type WellnessScores = Pick<WellnessEntry, "son_qualitat" | "fatiga" | "estres" | "estat_anim" | "recuperacio" | "dolor_eva">;

/** Suma dels 5 ítems 1–5 (5–25). Més alt = millor. */
export function wellnessScore(e: WellnessScores): number {
  return e.son_qualitat + e.fatiga + e.estres + e.estat_anim + e.recuperacio;
}

export type Semafor = "verd" | "groc" | "vermell" | "sense";

/**
 * Semàfor del dia:
 *  - vermell: dolor ≥ 5, algun ítem a 1, o puntuació ≤ 12
 *  - groc:    dolor ≥ 3, algun ítem a 2, o puntuació ≤ 17
 *  - verd:    la resta
 */
export function wellnessStatus(e: WellnessScores | null | undefined): Semafor {
  if (!e) return "sense";
  const items = [e.son_qualitat, e.fatiga, e.estres, e.estat_anim, e.recuperacio];
  const score = wellnessScore(e);
  if (e.dolor_eva >= 5 || items.some((v) => v <= 1) || score <= 12) return "vermell";
  if (e.dolor_eva >= 3 || items.some((v) => v <= 2) || score <= 17) return "groc";
  return "verd";
}

// ---------------------------------------------------------------------------
// Càrrega
// ---------------------------------------------------------------------------

export interface LoadInput {
  data: string;
  completada: boolean;
  rpe: number | null;
  durada_min: number | null;
  field_work?: { minuts_carrera: number | null; distancia_m: number | null; esprints: number | null } | null;
}

/** sRPE (Foster): RPE de sessió × minuts. Unitats arbitràries (UA). */
export function sessionLoad(s: Pick<LoadInput, "rpe" | "durada_min">): number {
  return s.rpe != null && s.durada_min != null ? Number(s.rpe) * Number(s.durada_min) : 0;
}

export interface WeekLoad {
  setmana: string; // dilluns
  sessions: number;
  srpe: number;
  minutsCarrera: number;
  distanciaM: number;
  esprints: number;
}

/** Agrega les sessions completades per setmana (de dilluns a diumenge), ordenat cronològicament. */
export function weeklyLoads(sessions: LoadInput[]): WeekLoad[] {
  const map = new Map<string, WeekLoad>();
  for (const s of sessions) {
    if (!s.completada) continue;
    const key = mondayOf(s.data);
    const w = map.get(key) ?? { setmana: key, sessions: 0, srpe: 0, minutsCarrera: 0, distanciaM: 0, esprints: 0 };
    w.sessions += 1;
    w.srpe += sessionLoad(s);
    w.minutsCarrera += Number(s.field_work?.minuts_carrera ?? 0);
    w.distanciaM += Number(s.field_work?.distancia_m ?? 0);
    w.esprints += Number(s.field_work?.esprints ?? 0);
    map.set(key, w);
  }
  return [...map.values()].sort((a, b) => a.setmana.localeCompare(b.setmana));
}

/** Variació percentual respecte a un valor anterior. null si no es pot calcular. */
export function pctChange(current: number, previous: number | null | undefined): number | null {
  if (previous == null || previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

/**
 * Comparativa de la setmana actual amb l'anterior. Si la setmana anterior no té
 * sessions es considera 0.
 */
export function loadProgression(weeks: WeekLoad[], today: string) {
  const thisMonday = mondayOf(today);
  const prevMonday = addDays(thisMonday, -7);
  const actual = weeks.find((w) => w.setmana === thisMonday);
  const anterior = weeks.find((w) => w.setmana === prevMonday);
  const srpe = actual?.srpe ?? 0;
  const srpeAnterior = anterior?.srpe ?? 0;
  const distancia = actual?.distanciaM ?? 0;
  const distanciaAnterior = anterior?.distanciaM ?? 0;
  return {
    srpe,
    srpeAnterior,
    srpeCanvi: pctChange(srpe, srpeAnterior),
    distancia,
    distanciaAnterior,
    distanciaCanvi: pctChange(distancia, distanciaAnterior),
  };
}

// ---------------------------------------------------------------------------
// Tests físics
// ---------------------------------------------------------------------------

/**
 * % respecte al baseline. Positiu = millora, negatiu = dèficit, tant si el test
 * és "més és millor" (salt, força) com "menys és millor" (temps).
 */
export function pctVsBaseline(valor: number, baseline: number, millorSi: "mes" | "menys" = "mes"): number | null {
  const raw = pctChange(valor, baseline);
  if (raw == null) return null;
  return millorSi === "menys" ? -raw : raw;
}

/** Índex de simetria (Limb Symmetry Index) en %. 100 = simètric. */
export function lsi(lesionat: number, sa: number, millorSi: "mes" | "menys" = "mes"): number | null {
  if (millorSi === "menys") return lesionat === 0 ? null : (sa / lesionat) * 100;
  return sa === 0 ? null : (lesionat / sa) * 100;
}

type TestRow = Pick<PhysicalTest, "nom" | "costat" | "valor" | "data" | "es_baseline" | "millor_si" | "unitat" | "tipus"> & { created_at?: string };

const byDate = (a: TestRow, b: TestRow) => a.data.localeCompare(b.data) || (a.created_at ?? "").localeCompare(b.created_at ?? "");

/**
 * Baseline d'un test i costat: el darrer marcat com a baseline; si cap ho està,
 * el primer valor registrat (valor inicial).
 */
export function baselineOf(rows: TestRow[]): TestRow | null {
  if (rows.length === 0) return null;
  const sorted = [...rows].sort(byDate);
  const flagged = sorted.filter((r) => r.es_baseline);
  return flagged.length ? flagged[flagged.length - 1] : sorted[0];
}

export interface TestSideSummary {
  costat: CostatTest;
  baseline: number;
  baselineData: string;
  actual: number;
  actualData: string;
  pct: number | null;
  mesures: number;
}

export interface TestSummary {
  nom: string;
  tipus: TestRow["tipus"];
  unitat: string | null;
  millorSi: "mes" | "menys";
  costats: TestSideSummary[];
  lsi: number | null;
  lsiData: string | null;
}

/** Resum de cada test: valor actual vs baseline per costat, i darrer LSI disponible. */
export function summarizeTests(tests: TestRow[]): TestSummary[] {
  const byName = new Map<string, TestRow[]>();
  for (const t of tests) byName.set(t.nom, [...(byName.get(t.nom) ?? []), t]);

  const out: TestSummary[] = [];
  for (const [nom, rows] of byName) {
    const sorted = [...rows].sort(byDate);
    const last = sorted[sorted.length - 1];
    const millorSi = last.millor_si;
    const costats: TestSideSummary[] = [];
    for (const costat of ["lesionat", "sa", "bilateral"] as const) {
      const side = sorted.filter((r) => r.costat === costat);
      if (!side.length) continue;
      const base = baselineOf(side)!;
      const act = side[side.length - 1];
      costats.push({
        costat,
        baseline: Number(base.valor),
        baselineData: base.data,
        actual: Number(act.valor),
        actualData: act.data,
        pct: act === base ? null : pctVsBaseline(Number(act.valor), Number(base.valor), millorSi),
        mesures: side.length,
      });
    }

    // LSI: darrera data amb valor dels dos costats
    let lsiVal: number | null = null;
    let lsiData: string | null = null;
    const dates = [...new Set(sorted.map((r) => r.data))].sort().reverse();
    for (const d of dates) {
      const les = sorted.filter((r) => r.data === d && r.costat === "lesionat").at(-1);
      const sa = sorted.filter((r) => r.data === d && r.costat === "sa").at(-1);
      if (les && sa) {
        lsiVal = lsi(Number(les.valor), Number(sa.valor), millorSi);
        lsiData = d;
        break;
      }
    }

    out.push({ nom, tipus: last.tipus, unitat: last.unitat, millorSi, costats, lsi: lsiVal, lsiData });
  }
  return out.sort((a, b) => a.nom.localeCompare(b.nom, "ca"));
}

export function formatPct(v: number | null | undefined, decimals = 0): string {
  if (v == null || !Number.isFinite(v)) return "—";
  const s = v.toFixed(decimals);
  return `${v > 0 ? "+" : ""}${s}%`;
}

/** Converteix un enllaç de YouTube/Vimeo a URL incrustable. null si no és cap dels dos. */
export function videoEmbedUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\.|^m\./, "");
    if (host === "youtu.be") return `https://www.youtube-nocookie.com/embed/${u.pathname.slice(1)}`;
    if (host === "youtube.com") {
      if (u.pathname.startsWith("/shorts/")) return `https://www.youtube-nocookie.com/embed/${u.pathname.split("/")[2]}`;
      if (u.pathname.startsWith("/embed/")) return `https://www.youtube-nocookie.com${u.pathname}`;
      const v = u.searchParams.get("v");
      return v ? `https://www.youtube-nocookie.com/embed/${v}` : null;
    }
    if (host === "vimeo.com") {
      const id = u.pathname.split("/").filter(Boolean)[0];
      return /^\d+$/.test(id ?? "") ? `https://player.vimeo.com/video/${id}` : null;
    }
    return null;
  } catch {
    return null;
  }
}
