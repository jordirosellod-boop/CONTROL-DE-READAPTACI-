// Avisos push diaris de l'app de readaptació (CE Europa).
// - Crida diària (pg_cron) amb la capçalera x-avisos-token → avisa tot el staff.
// - Crida "prova" amb la sessió d'un membre del staff → envia un avís de prova només a ell/ella.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-avisos-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function clauServei(): string {
  const json = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (json) {
    try {
      const k = JSON.parse(json);
      if (k?.default) return k.default;
    } catch { /* res */ }
  }
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
}

function avuiMadrid(dies = 0): string {
  const d = new Date(Date.now() + dies * 86400000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid" }).format(d);
}

const resposta = (cos: unknown, status = 200) =>
  new Response(JSON.stringify(cos), { status, headers: { ...CORS, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return resposta({ error: "method" }, 405);

  const db = createClient(Deno.env.get("SUPABASE_URL")!, clauServei(), { auth: { persistSession: false } });
  const { data: config } = await db.from("ra_config").select("clau, valor");
  const cfg = Object.fromEntries((config ?? []).map((r) => [r.clau, r.valor]));
  if (!cfg.vapid_public || !cfg.vapid_private) return resposta({ error: "config" }, 500);
  webpush.setVapidDetails("mailto:jordirosellod@gmail.com", cfg.vapid_public, cfg.vapid_private);

  let destinataris: string | null = null; // null = tot el staff
  let missatges: { title: string; body: string; url: string; tag: string }[] = [];

  const token = req.headers.get("x-avisos-token");
  // deno-lint-ignore no-explicit-any
  const cos: any = await req.json().catch(() => ({}));
  if (token && token === cfg.avisos_token && cos?.tipus === "alerta" && typeof cos.wellness_id === "string") {
    // Alerta immediata: un jugador ha enviat un wellness en vermell des del formulari
    const { data: w } = await db
      .from("ra_wellness_entries")
      .select("player_id, dolor_eva, son_qualitat, fatiga, estres, estat_anim, recuperacio, comentari, ra_players(nom, cognoms)")
      .eq("id", cos.wellness_id)
      .maybeSingle();
    if (!w) return resposta({ enviats: 0, missatges: 0 });
    // deno-lint-ignore no-explicit-any
    const p = (w as any).ra_players;
    const punts = w.son_qualitat + w.fatiga + w.estres + w.estat_anim + w.recuperacio;
    const motiu = w.dolor_eva >= 5 ? `dolor ${w.dolor_eva}/10` : `wellness ${punts}/25`;
    missatges = [{
      title: `🔴 ${p?.nom ?? "Jugador"} ${p?.cognoms ?? ""}`.trim(),
      body: `Wellness en vermell (${motiu})${w.comentari ? `: «${String(w.comentari).slice(0, 80)}»` : ""}`,
      url: `/jugadors/${w.player_id}`,
      tag: `alerta-${w.player_id}`,
    }];
  } else if (token && token === cfg.avisos_token) {
    // Resum diari
    const avui = avuiMadrid();
    const dema = avuiMadrid(1);
    const { data: lesions } = await db
      .from("ra_injuries")
      .select("player_id, data_prevista, ra_players!inner(id, nom, cognoms, arxivat)")
      .eq("activa", true)
      .eq("ra_players.arxivat", false);
    const actius = new Map<string, { nom: string; dema: boolean }>();
    for (const l of lesions ?? []) {
      // deno-lint-ignore no-explicit-any
      const p = (l as any).ra_players;
      const prev = actius.get(l.player_id);
      actius.set(l.player_id, { nom: `${p.nom} ${p.cognoms}`.trim(), dema: (prev?.dema ?? false) || l.data_prevista === dema });
    }
    if (actius.size > 0) {
      const { data: fets } = await db.from("ra_wellness_entries").select("player_id").eq("data", avui).in("player_id", [...actius.keys()]);
      const ambWellness = new Set((fets ?? []).map((f) => f.player_id));
      const sense = [...actius.entries()].filter(([id]) => !ambWellness.has(id)).map(([, j]) => j.nom);
      if (sense.length > 0) {
        missatges.push({
          title: "Wellness pendent",
          body: sense.length <= 3 ? `Falta el wellness d'avui: ${sense.join(", ")}` : `${sense.length} jugadors lesionats sense wellness avui`,
          url: "/",
          tag: "wellness",
        });
      }
      const tornen = [...actius.values()].filter((j) => j.dema).map((j) => j.nom);
      if (tornen.length > 0) {
        missatges.push({
          title: "Retorn previst demà",
          body: `${tornen.join(", ")} ${tornen.length === 1 ? "té" : "tenen"} el retorn previst per demà`,
          url: "/",
          tag: "retorn",
        });
      }
    }
  } else {
    // Prova: només per a qui ho demana (ha de ser staff)
    const jwt = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
    const { data: usuari } = jwt ? await db.auth.getUser(jwt) : { data: { user: null } };
    const email = usuari.user?.email?.toLowerCase();
    if (!email) return resposta({ error: "auth" }, 401);
    const { data: staff } = await db.from("ra_staff").select("email").eq("email", email).maybeSingle();
    if (!staff) return resposta({ error: "auth" }, 403);
    destinataris = email;
    missatges = [{ title: "CE Europa · Readaptació", body: "Els avisos funcionen! 💙", url: "/compte", tag: "prova" }];
  }

  if (missatges.length === 0) return resposta({ enviats: 0, missatges: 0 });

  let q = db.from("ra_push_subs").select("endpoint, p256dh, auth");
  if (destinataris) q = q.eq("email", destinataris);
  const { data: subs } = await q;

  let enviats = 0;
  const caducades: string[] = [];
  for (const s of subs ?? []) {
    for (const m of missatges) {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(m), { TTL: 60 * 60 * 12 });
        enviats++;
      } catch (e) {
        // deno-lint-ignore no-explicit-any
        const codi = (e as any)?.statusCode;
        if (codi === 404 || codi === 410) {
          caducades.push(s.endpoint);
          break;
        }
        console.error("push", codi, String(e));
      }
    }
  }
  if (caducades.length) await db.from("ra_push_subs").delete().in("endpoint", caducades);
  return resposta({ enviats, subscripcions: subs?.length ?? 0, missatges: missatges.length, caducades: caducades.length });
});
