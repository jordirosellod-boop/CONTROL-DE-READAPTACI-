"use server";

import { clientAnonim } from "./supabase/anon";
import { int, num, str, type FormState } from "./form";
import { TOKEN_VALID } from "./formulari";
import { filaWellness } from "./wellness";

// Accions del formulari públic dels jugadors: no hi ha cap sessió; l'enllaç porta un codi
// secret i la base de dades només deixa desar el wellness d'avui i l'RPE de sessions recents.

const ERROR_ENLLAC = "Aquest formulari ja no és vàlid. Demana l'enllaç nou al readaptador.";
const UUID = /^[0-9a-f-]{36}$/;

function errorDe(message: string): string {
  if (message.includes("enllac")) return ERROR_ENLLAC;
  if (message.includes("jugador")) return "Tria el teu nom de la llista.";
  if (message.includes("sessio")) return "Aquesta sessió ja no es pot puntuar.";
  return "No s'ha pogut enviar. Torna-ho a provar.";
}

export async function enviaWellnessFormulari(token: string, _: FormState, fd: FormData): Promise<FormState> {
  if (!TOKEN_VALID.test(token)) return { error: ERROR_ENLLAC };
  const jugador = str(fd, "jugador");
  if (!jugador || !UUID.test(jugador)) return { error: "Tria el teu nom de la llista." };
  const res = filaWellness(jugador, fd);
  if (res.error !== undefined) return { error: res.error };
  const r = res.row;
  const { error } = await clientAnonim().rpc("ra_form_wellness", {
    p_token: token,
    p_player: jugador,
    p: {
      son_qualitat: r.son_qualitat,
      son_hores: r.son_hores,
      fatiga: r.fatiga,
      estres: r.estres,
      estat_anim: r.estat_anim,
      recuperacio: r.recuperacio,
      dolor_eva: r.dolor_eva,
      dolor_zones: r.dolor_zones,
      comentari: r.comentari,
    },
  });
  if (error) return { error: errorDe(error.message) };
  return { ok: "wellness", ts: Date.now() };
}

export async function enviaRpeFormulari(token: string, _: FormState, fd: FormData): Promise<FormState> {
  if (!TOKEN_VALID.test(token)) return { error: ERROR_ENLLAC };
  const jugador = str(fd, "jugador");
  if (!jugador || !UUID.test(jugador)) return { error: "Tria el teu nom de la llista." };
  const rpe = num(fd, "rpe");
  if (rpe == null || rpe < 1 || rpe > 10) return { error: "Tria com de dura ha estat la sessió (1–10)." };
  const durada = int(fd, "durada_min");
  if (durada != null && (durada < 1 || durada > 600)) return { error: "Els minuts han d'estar entre 1 i 600." };
  const sessio = str(fd, "sessio");
  const { error } = await clientAnonim().rpc("ra_form_rpe", {
    p_token: token,
    p_player: jugador,
    p_session: sessio && UUID.test(sessio) ? sessio : null,
    p_rpe: rpe,
    p_durada: durada,
  });
  if (error) return { error: errorDe(error.message) };
  return { ok: "rpe", ts: Date.now() };
}
