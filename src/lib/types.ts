export type Posicio =
  | "porter"
  | "defensa_central"
  | "lateral"
  | "migcampista"
  | "extrem"
  | "davanter"
  | "altre";

export type CamaDominant = "dreta" | "esquerra" | "ambidextre";

export interface Player {
  id: string;
  nom: string;
  cognoms: string;
  edat: number | null;
  posicio: Posicio | null;
  cama_dominant: CamaDominant | null;
  historial_lesions: string | null;
  arxivat: boolean;
  created_at: string;
}

export interface Injury {
  id: string;
  player_id: string;
  diagnostic: string;
  categoria: string | null;
  zona: string | null;
  costat: "dreta" | "esquerra" | "bilateral" | null;
  data_lesio: string;
  data_cirurgia: string | null;
  data_alta: string | null;
  activa: boolean;
  notes: string | null;
}

export interface WellnessEntry {
  id: string;
  player_id: string;
  data: string;
  son_qualitat: number;
  son_hores: number | null;
  fatiga: number;
  estres: number;
  estat_anim: number;
  dolor_eva: number;
  dolor_zones: string[];
  recuperacio: number;
  comentari: string | null;
}

export interface Exercise {
  id: string;
  nom: string;
  categoria: string | null;
  video_url: string | null;
  descripcio: string | null;
}

export interface Session {
  id: string;
  player_id: string;
  injury_id: string | null;
  data: string;
  nom: string | null;
  completada: boolean;
  rpe: number | null;
  durada_min: number | null;
  notes: string | null;
}

export interface SessionExercise {
  id: string;
  session_id: string;
  exercise_id: string | null;
  ordre: number;
  nom: string;
  video_url: string | null;
  series: number | null;
  repeticions: number | null;
  temps_s: number | null;
  carrega: string | null;
  descans_s: number | null;
  rpe: number | null;
  notes: string | null;
}

export interface FieldWork {
  id: string;
  session_id: string;
  minuts_carrera: number | null;
  distancia_m: number | null;
  vel_max_kmh: number | null;
  vel_mitjana_kmh: number | null;
  esprints: number | null;
  acceleracions: number | null;
  desacceleracions: number | null;
  canvis_direccio: number | null;
  tipus_treball: string | null;
  notes: string | null;
}

export type TipusTest = "forca" | "mobilitat" | "cmj" | "hop" | "isometric" | "especific";
export type CostatTest = "lesionat" | "sa" | "bilateral";

export interface PhysicalTest {
  id: string;
  player_id: string;
  injury_id: string | null;
  tipus: TipusTest;
  nom: string;
  unitat: string | null;
  costat: CostatTest;
  valor: number;
  millor_si: "mes" | "menys";
  data: string;
  es_baseline: boolean;
  notes: string | null;
}

export interface Treatment {
  id: string;
  player_id: string;
  injury_id: string | null;
  data: string;
  durada_min: number | null;
  tecniques: string[];
  zones: string[];
  dolor_abans: number | null;
  dolor_despres: number | null;
  notes: string | null;
}
