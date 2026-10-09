import { SUPABASE_KEY, SUPABASE_URL, isSupabaseConfigured } from "@/lib/supabase/env";

/**
 * Vercel Cron crida aquesta ruta cada dia (vegeu vercel.json) perquè el projecte
 * gratuït de Supabase no es posi en pausa per inactivitat (passa als 7 dies).
 * Fa una consulta mínima com a usuari anònim: no llegeix ni retorna cap dada (RLS).
 */
export async function GET(request: Request) {
  // Si hi ha CRON_SECRET configurat, només Vercel Cron pot cridar-la.
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ ok: false }, { status: 401 });
  }
  if (!isSupabaseConfigured) return Response.json({ ok: false, error: "Supabase no configurat" }, { status: 500 });

  const res = await fetch(`${SUPABASE_URL}/rest/v1/players?select=id&limit=1`, {
    headers: { apikey: SUPABASE_KEY },
    cache: "no-store",
  });
  return Response.json({ ok: res.ok, status: res.status, at: new Date().toISOString() }, { status: res.ok ? 200 : 502 });
}
