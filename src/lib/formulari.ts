import { cache } from "react";
import { clientAnonim } from "./supabase/anon";

export interface JugadorFormulari {
  id: string;
  nom: string;
  cognoms: string;
  dorsal: number | null;
  wellness_avui: boolean;
  sessions: { id: string; data: string; nom: string | null; durada_min: number | null }[];
}

export interface InfoFormulari {
  avui: string;
  jugadors: JugadorFormulari[];
}

export const TOKEN_VALID = /^[A-Za-z0-9_-]{24,64}$/;

/** Dades del formulari de l'equip a partir del codi de l'enllaç (null si no és vàlid). */
export const infoFormulari = cache(async (token: string): Promise<InfoFormulari | null> => {
  if (!TOKEN_VALID.test(token)) return null;
  const { data, error } = await clientAnonim().rpc("ra_form_info", { p_token: token });
  if (error) throw new Error(error.message);
  return (data as InfoFormulari | null) ?? null;
});
