import { todayISO } from "./calc";
import { int, list, num, str } from "./form";

export interface FilaWellness {
  player_id: string;
  data: string;
  son_qualitat: number | null;
  son_hores: number | null;
  fatiga: number | null;
  estres: number | null;
  estat_anim: number | null;
  dolor_eva: number;
  dolor_zones: string[];
  recuperacio: number | null;
  comentari: string | null;
}

/** Construeix i valida la fila de wellness a partir d'un formulari (també des de la cua sense connexió). */
export function filaWellness(playerId: string, fd: FormData): { row: FilaWellness; error?: undefined } | { row?: undefined; error: string } {
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
  return { row };
}
