import { cache } from "react";
import { clientAnonim } from "./supabase/anon";

export interface InfoJugador {
  nom: string;
  cognoms: string;
  foto_url: string | null;
  dorsal: number | null;
  avui: string;
  wellness_avui: boolean;
  sessions: { id: string; data: string; nom: string | null; durada_min: number | null }[];
}

export const TOKEN_VALID = /^[A-Za-z0-9_-]{24,64}$/;

/** Dades mínimes del jugador a partir del seu enllaç secret (null si no és vàlid). */
export const infoJugador = cache(async (token: string): Promise<InfoJugador | null> => {
  if (!TOKEN_VALID.test(token)) return null;
  const { data, error } = await clientAnonim().rpc("ra_jugador_info", { p_token: token });
  if (error) throw new Error(error.message);
  return (data as InfoJugador | null) ?? null;
});
