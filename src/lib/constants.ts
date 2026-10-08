import type { CostatTest, Posicio, TipusTest } from "./types";

export const POSICIONS: { value: Posicio; label: string }[] = [
  { value: "porter", label: "Porter" },
  { value: "defensa_central", label: "Defensa central" },
  { value: "lateral", label: "Lateral" },
  { value: "migcampista", label: "Migcampista" },
  { value: "extrem", label: "Extrem" },
  { value: "davanter", label: "Davanter" },
  { value: "altre", label: "Altre" },
];

export const CAMES = [
  { value: "dreta", label: "Dreta" },
  { value: "esquerra", label: "Esquerra" },
  { value: "ambidextre", label: "Ambidextre" },
] as const;

export const CATEGORIES_LESIO = [
  { value: "muscular", label: "Muscular" },
  { value: "lligamentosa", label: "Lligamentosa" },
  { value: "tendinosa", label: "Tendinosa" },
  { value: "ossia", label: "Òssia" },
  { value: "articular", label: "Articular" },
  { value: "meniscal", label: "Meniscal" },
  { value: "altra", label: "Altra" },
] as const;

export const COSTATS_LESIO = [
  { value: "dreta", label: "Dreta" },
  { value: "esquerra", label: "Esquerra" },
  { value: "bilateral", label: "Bilateral" },
] as const;

export const TIPUS_TEST: { value: TipusTest; label: string }[] = [
  { value: "forca", label: "Força" },
  { value: "mobilitat", label: "Mobilitat" },
  { value: "cmj", label: "CMJ" },
  { value: "hop", label: "Hop test" },
  { value: "isometric", label: "Isomètric" },
  { value: "especific", label: "Específic de la lesió" },
];

export const COSTATS_TEST: { value: CostatTest; label: string }[] = [
  { value: "bilateral", label: "Bilateral / no aplica" },
  { value: "lesionat", label: "Costat lesionat" },
  { value: "sa", label: "Costat sa" },
];

/** Tests habituals per suggerir al formulari (es poden escriure noms nous). */
export const TESTS_SUGGERITS = [
  "CMJ",
  "CMJ unipodal",
  "Single hop",
  "Triple hop",
  "Crossover hop",
  "6 m timed hop",
  "Side hop",
  "Isomètric quàdriceps",
  "Isomètric isquiotibials",
  "Nordic hamstring",
  "Adductors (squeeze)",
  "Abductors",
  "Knee to wall",
  "Flexió de maluc (ROM)",
  "Extensió de genoll (ROM)",
  "Flexió de genoll (ROM)",
  "1RM sentadeta",
  "Y-Balance",
];

/** Zones del cos per marcar dolor o molèsties. D = dreta, E = esquerra. */
export const ZONES_COS: { value: string; label: string; grup: string }[] = [
  { value: "cap_coll", label: "Cap / coll", grup: "Tronc" },
  { value: "espatlla_d", label: "Espatlla D", grup: "Extremitat superior" },
  { value: "espatlla_e", label: "Espatlla E", grup: "Extremitat superior" },
  { value: "colze_canell", label: "Colze / canell", grup: "Extremitat superior" },
  { value: "lumbar", label: "Lumbar", grup: "Tronc" },
  { value: "dorsal", label: "Dorsal", grup: "Tronc" },
  { value: "abdomen", label: "Abdomen", grup: "Tronc" },
  { value: "pubis", label: "Pubis / engonal", grup: "Tronc" },
  { value: "maluc_d", label: "Maluc D", grup: "Maluc i cuixa" },
  { value: "maluc_e", label: "Maluc E", grup: "Maluc i cuixa" },
  { value: "quadriceps_d", label: "Quàdriceps D", grup: "Maluc i cuixa" },
  { value: "quadriceps_e", label: "Quàdriceps E", grup: "Maluc i cuixa" },
  { value: "isquios_d", label: "Isquiotibials D", grup: "Maluc i cuixa" },
  { value: "isquios_e", label: "Isquiotibials E", grup: "Maluc i cuixa" },
  { value: "adductors_d", label: "Adductors D", grup: "Maluc i cuixa" },
  { value: "adductors_e", label: "Adductors E", grup: "Maluc i cuixa" },
  { value: "genoll_d", label: "Genoll D", grup: "Cama" },
  { value: "genoll_e", label: "Genoll E", grup: "Cama" },
  { value: "bessons_d", label: "Bessons D", grup: "Cama" },
  { value: "bessons_e", label: "Bessons E", grup: "Cama" },
  { value: "aquil_d", label: "Tendó d'Aquil·les D", grup: "Cama" },
  { value: "aquil_e", label: "Tendó d'Aquil·les E", grup: "Cama" },
  { value: "turmell_d", label: "Turmell D", grup: "Cama" },
  { value: "turmell_e", label: "Turmell E", grup: "Cama" },
  { value: "peu_d", label: "Peu D", grup: "Cama" },
  { value: "peu_e", label: "Peu E", grup: "Cama" },
];

/** Tècniques habituals de tractament a camilla. */
export const TECNIQUES: { value: string; label: string; grup: string }[] = [
  { value: "massoterapia", label: "Massoteràpia", grup: "Manual" },
  { value: "terapia_manual", label: "Teràpia manual", grup: "Manual" },
  { value: "mobilitzacio", label: "Mobilització articular", grup: "Manual" },
  { value: "manipulacio", label: "Manipulació", grup: "Manual" },
  { value: "miofascial", label: "Inducció miofascial", grup: "Manual" },
  { value: "neurodinamia", label: "Neurodinàmia", grup: "Manual" },
  { value: "estiraments", label: "Estiraments", grup: "Manual" },
  { value: "drenatge", label: "Drenatge limfàtic", grup: "Manual" },
  { value: "puncio_seca", label: "Punció seca", grup: "Invasiva" },
  { value: "epi", label: "Electròlisi (EPI)", grup: "Invasiva" },
  { value: "neuromodulacio", label: "Neuromodulació percutània", grup: "Invasiva" },
  { value: "tecar", label: "Diatèrmia / Tecar", grup: "Electroteràpia i aparells" },
  { value: "tens", label: "TENS", grup: "Electroteràpia i aparells" },
  { value: "ems", label: "Electroestimulació (EMS)", grup: "Electroteràpia i aparells" },
  { value: "ones_xoc", label: "Ones de xoc", grup: "Electroteràpia i aparells" },
  { value: "ultrasons", label: "Ultrasons", grup: "Electroteràpia i aparells" },
  { value: "laser", label: "Làser", grup: "Electroteràpia i aparells" },
  { value: "magnetoterapia", label: "Magnetoteràpia", grup: "Electroteràpia i aparells" },
  { value: "pressoterapia", label: "Pressoteràpia", grup: "Electroteràpia i aparells" },
  { value: "crioterapia", label: "Crioteràpia / gel", grup: "Altres" },
  { value: "termoterapia", label: "Termoteràpia", grup: "Altres" },
  { value: "vendatge", label: "Vendatge funcional", grup: "Altres" },
  { value: "kinesiotape", label: "Kinesiotape", grup: "Altres" },
];

export const WELLNESS_ITEMS = [
  { key: "son_qualitat", label: "Qualitat del son", baix: "Molt dolenta", alt: "Excel·lent" },
  { key: "fatiga", label: "Fatiga", baix: "Molt fatigat", alt: "Molt fresc" },
  { key: "estres", label: "Estrès", baix: "Molt estressat", alt: "Molt relaxat" },
  { key: "estat_anim", label: "Estat d'ànim", baix: "Molt baix", alt: "Molt bo" },
  { key: "recuperacio", label: "Sensació de recuperació", baix: "Gens recuperat", alt: "Totalment recuperat" },
] as const;

export function labelOf<T extends { value: string; label: string }>(
  list: readonly T[],
  value: string | null | undefined,
): string {
  if (!value) return "—";
  return list.find((x) => x.value === value)?.label ?? value;
}
