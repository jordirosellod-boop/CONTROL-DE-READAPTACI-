// Plantilles del CE Europa (temporada 2026/27), extretes de ceeuropa.cat.
// Les fotos s'enllacen directament des de la web del club. Els filials no tenen
// foto individual a la web: només nom, dorsal i posició.
// Per actualitzar-la quan canviï la plantilla, només cal editar aquesta llista.
import type { Posicio } from "./types";

export interface JugadorPlantilla {
  nom: string;
  cognoms: string;
  dorsal: number | null;
  posicio: Posicio;
  equip: Equip;
  foto: string | null;
}

export const EQUIPS = ["Primer equip masculí", "Primer equip femení", "Filial masculí", "Filial femení"] as const;
export type Equip = (typeof EQUIPS)[number];

const WEB = "https://www.ceeuropa.cat/wp-content/uploads/";
const POS: Record<string, Posicio> = { P: "porter", D: "defensa_central", M: "migcampista", F: "davanter" };

// [nom complet, dorsal, posició (P/D/M/F), foto relativa a wp-content/uploads o null]
type Fila = [string, number | null, keyof typeof POS, string | null];

const DADES: Record<Equip, Fila[]> = {
  "Primer equip masculí": [
    ["Lucas Madrigal", 1, "P", "2026/09/MadrigalWeb-768x1024.jpg"],
    ["Nil Ruiz", 13, "P", "2026/09/NilRuizweb-768x1024.jpg"],
    ["Joan Puig", 6, "D", "2026/09/JoanPuigweb-768x1024.jpg"],
    ["Enol Coto Serrano", 2, "D", "2026/09/CotoWeb-768x1024.jpg"],
    ["Víctor Edo", 15, "D", "2026/09/VictorEdoweb-768x1024.jpg"],
    ["Pedro Cancelo", 20, "D", "2026/09/Canceloweb-768x1024.jpg"],
    ["Àlex Cano", 4, "D", "2026/09/AlexCanoweb-768x1024.jpg"],
    ["Arnau Campeny", 5, "D", "2026/09/Campenyweb-768x1024.jpg"],
    ["Marcel Sgrò", 3, "D", "2026/09/Sgroweb-768x1024.jpg"],
    ["Guillem Cardelús", 16, "M", "2026/09/Cardelusweb-768x1024.jpg"],
    ["Joan Mascaró", 19, "M", "2026/09/Mascaroweb-768x1024.jpg"],
    ["Albert Tolosa 'Tito'", 23, "M", "2026/09/Titoweb-768x1024.jpg"],
    ["Gregori Gracia 'Gori'", 8, "M", "2026/09/Goriweb-768x1024.jpg"],
    ["Marc Anglès", 10, "M", "2026/09/Anglesweb-768x1024.jpg"],
    ["Víctor Morales", 14, "M", "2026/09/VictorMoralesweb-768x1024.jpg"],
    ["Khalid Noureddine", 9, "F", "2026/09/Khalidweb-768x1024.jpg"],
    ["Flavio Ribeiro", 7, "F", "2026/09/Flavioweb-768x1024.jpg"],
    ["Adrián Expósito", 11, "F", "2026/09/Expositoweb-768x1024.jpg"],
    ["Adrià López Padillo", 22, "F", "2026/09/Padilloweb-768x1024.jpg"],
    ["Youssef Zayzoun", 17, "F", "2026/09/Zayzounweb-768x1024.jpg"],
    ["Teto Martín", null, "F", null],
  ],
  "Primer equip femení": [
    ["Alba Sánchez", 1, "P", "2026/04/Copia-de-1-Alba-Sanchez.jpg"],
    ["Núria Benet", 2, "D", "2026/04/NuriaBenet_2526_web-819x1024.jpg"],
    ["Júlia Serrat", 3, "D", "2026/04/Serrat_2526_web-819x1024.jpg"],
    ["Ari Márquez", 21, "D", "2026/04/AriMarquez_2526_web-819x1024.jpg"],
    ["Haizea Uranga", 22, "D", "2026/04/22-Haizea-Uranga.jpg"],
    ["Naiara Lemos", 29, "D", "2026/04/Lemos_2526.jpg"],
    ["Aina Torres", 20, "M", "2026/04/AinaTorres_2526_web-819x1024.jpg"],
    ["Anon Kojima", 27, "M", null],
    ["Natalia Fernández", 11, "F", "2026/04/Nat_2526_web-819x1024.jpg"],
    ["María Abad", 23, "F", "2026/04/Abad_2526_web-819x1024.jpg"],
    ["Alba Pérez", 30, "F", "2026/04/AlbaPerez_2526.jpg"],
  ],
  "Filial masculí": [
    ["Álvaro Rodríguez Rodríguez", 1, "P", null],
    ["Damià Ferrando Miró", 13, "P", null],
    ["Otger Sastre Pujol", 23, "D", null],
    ["Javier López Santana", 20, "D", null],
    ["Edouard Raymond Robert Le Moigne", 25, "D", null],
    ["Marc Jurado López", 4, "D", null],
    ["Arnau Villa González", 5, "D", null],
    ["Roman Vittucci Vilá", 12, "D", null],
    ["Sergi Batuecas Bassa", 2, "M", null],
    ["Ivan Castillejo Merino", 21, "M", null],
    ["Sergi Hernández Miralles", 8, "M", null],
    ["Adrià Almasqué Cortijo", 17, "M", null],
    ["Pau Sala Aires", 14, "M", null],
    ["Aiman Boussid", 7, "F", null],
    ["Daniel Ferrer Sáez", 3, "F", null],
    ["Lamin Khan", 22, "F", null],
    ["Nil Valero López", 18, "F", null],
    ["Adam El Mokhles", 19, "F", null],
    ["Marc Fuster Aguayo", 11, "F", null],
    ["Joel Cadenas Fernández", 16, "F", null],
    ["Eric Compte Copoví", 9, "F", null],
  ],
  "Filial femení": [
    ["Paula González Amores", 1, "P", null],
    ["Ainhoa Ramírez Mensa", 13, "P", null],
    ["Sonia Moya Sotelo", 2, "D", null],
    ["Victoria Maria Franco Rom", 3, "D", null],
    ["Marina Carro Mascaró", 4, "D", null],
    ["Anabel Chamorro Garrido", 7, "D", null],
    ["Carla González Vilaplana", 8, "D", null],
    ["Clara Vendrell Soms", 12, "D", null],
    ["Irina Mestre Closa", 15, "D", null],
    ["Aina Ortiz Santos", 22, "D", null],
    ["Maria Botello Marchena", 5, "M", null],
    ["Mariona Gámez Moliner", 6, "M", null],
    ["Mónica Brañas Rubert", 14, "M", null],
    ["Mar Couceiro Zamora", 16, "M", null],
    ["Berta Egea López", 21, "M", null],
    ["Alma Ros Mogas", 23, "M", null],
    ["Martina Del Río Anoro", 30, "M", null],
    ["Carla Autero", 9, "F", null],
    ["Paula Arcos Banach", 10, "F", null],
    ["Montse Amella Matías", 19, "F", null],
    ["Adriana Manau", 20, "F", null],
  ],
};

export const PLANTILLA: JugadorPlantilla[] = EQUIPS.flatMap((equip) =>
  DADES[equip].map(([complet, dorsal, pos, foto]) => {
    const [nom, ...resta] = complet.split(" ");
    return { nom, cognoms: resta.join(" "), dorsal, posicio: POS[pos], equip, foto: foto ? WEB + foto : null };
  }),
);

/** Text sense accents, cometes ni majúscules, per comparar noms. */
export function normalitza(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/['’"·.]/g, " ")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Busca un jugador a la plantilla pel nom escrit. Ha de coincidir el nom i
 * almenys un cognom (o l'àlies). Si n'hi ha més d'un, prioritza el que té foto.
 */
export function buscaAPlantilla(nom: string, cognoms: string): JugadorPlantilla | null {
  const n = normalitza(nom);
  const cs = normalitza(cognoms).split(" ").filter((p) => p.length > 1);
  if (!n || !cs.length) return null;
  const candidats = PLANTILLA.filter((j) => {
    const jn = normalitza(j.nom);
    const jc = normalitza(j.cognoms).split(" ");
    const nomCoincideix = jn === n || cs.includes(jn); // admet "Tito" o nom i cognom intercanviats
    return nomCoincideix && cs.some((c) => jc.includes(c) || c === jn);
  });
  return candidats.find((c) => c.foto) ?? candidats[0] ?? null;
}
