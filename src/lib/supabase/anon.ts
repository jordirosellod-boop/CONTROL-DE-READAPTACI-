import { createClient } from "@supabase/supabase-js";
import { SUPABASE_KEY, SUPABASE_URL } from "./env";

/** Client sense sessió: només pot cridar les funcions públiques de l'enllaç del jugador. */
export function clientAnonim() {
  return createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
}
