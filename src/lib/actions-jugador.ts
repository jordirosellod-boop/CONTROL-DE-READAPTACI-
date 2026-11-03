"use server";

import { revalidatePath } from "next/cache";
import { clientAnonim } from "./supabase/anon";
import { int, num, str, type FormState } from "./form";
import { TOKEN_VALID } from "./jugador";
import { filaWellness } from "./wellness";

// Accions públiques de l'enllaç del jugador: no hi ha sessió, l'autorització és el token secret
// i la base de dades només deixa desar el wellness d'avui i l'RPE de les seves sessions recents.

const ERROR_ENLLAC = "Aquest enllaç ja no és vàlid. Demana'n un de nou al readaptador.";

export async function enviaWellnessJugador(token: string, _: FormState, fd: FormData): Promise<FormState> {
  if (!TOKEN_VALID.test(token)) return { error: ERROR_ENLLAC };
  const res = filaWellness("jugador", fd);
  if (res.error !== undefined) return { error: res.error };
  const r = res.row;
  const camps = {
    son_qualitat: r.son_qualitat,
    son_hores: r.son_hores,
    fatiga: r.fatiga,
    estres: r.estres,
    estat_anim: r.estat_anim,
    recuperacio: r.recuperacio,
    dolor_eva: r.dolor_eva,
    dolor_zones: r.dolor_zones,
    comentari: r.comentari,
  };
  const { error } = await clientAnonim().rpc("ra_jugador_wellness", { p_token: token, p: camps });
  if (error) return { error: error.message.includes("enllac") ? ERROR_ENLLAC : "No s'ha pogut desar. Torna-ho a provar." };
  revalidatePath(`/j/${token}`);
  return { ok: "wellness", ts: Date.now() };
}

export async function enviaRpeJugador(token: string, _: FormState, fd: FormData): Promise<FormState> {
  if (!TOKEN_VALID.test(token)) return { error: ERROR_ENLLAC };
  const rpe = num(fd, "rpe");
  if (rpe == null || rpe < 1 || rpe > 10) return { error: "Tria com de dura ha estat la sessió (1–10)." };
  const durada = int(fd, "durada_min");
  if (durada != null && (durada < 1 || durada > 600)) return { error: "Els minuts han d'estar entre 1 i 600." };
  const sessio = str(fd, "sessio");
  const { error } = await clientAnonim().rpc("ra_jugador_rpe", {
    p_token: token,
    p_session: sessio && sessio !== "nova" ? sessio : null,
    p_rpe: rpe,
    p_durada: durada,
  });
  if (error) {
    if (error.message.includes("enllac")) return { error: ERROR_ENLLAC };
    if (error.message.includes("sessio")) return { error: "Aquesta sessió ja no es pot puntuar." };
    return { error: "No s'ha pogut desar. Torna-ho a provar." };
  }
  revalidatePath(`/j/${token}`);
  return { ok: "rpe", ts: Date.now() };
}
