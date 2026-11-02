import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { filaWellness } from "@/lib/wellness";

/** Un element desat al mòbil sense connexió. */
interface ElementCua {
  id: string;
  tipus: "wellness";
  playerId: string;
  camps: Record<string, string | string[]>;
}

/**
 * Rep els registres que s'han fet sense cobertura i els desa. Retorna quins
 * s'han desat i quins han fallat (perquè el mòbil els esborri de la cua o no).
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) return Response.json({ error: "Sense sessió" }, { status: 401 });
  const { data: staff } = await supabase.rpc("ra_is_staff");
  if (!staff) return Response.json({ error: "Sense accés" }, { status: 403 });

  const elements = ((await request.json().catch(() => [])) as ElementCua[]).slice(0, 50);
  const desats: string[] = [];
  const errors: { id: string; error: string }[] = [];
  for (const el of elements) {
    if (el.tipus !== "wellness" || typeof el.playerId !== "string") {
      errors.push({ id: el.id, error: "Tipus desconegut" });
      continue;
    }
    const fd = new FormData();
    for (const [k, v] of Object.entries(el.camps ?? {})) for (const x of Array.isArray(v) ? v : [v]) fd.append(k, String(x));
    const res = filaWellness(el.playerId, fd);
    if (res.error !== undefined) {
      errors.push({ id: el.id, error: res.error });
      continue;
    }
    const { error } = await supabase.from("ra_wellness_entries").upsert(res.row, { onConflict: "player_id,data" });
    if (error) errors.push({ id: el.id, error: error.message });
    else {
      desats.push(el.id);
      revalidatePath(`/jugadors/${el.playerId}`);
    }
  }
  if (desats.length) revalidatePath("/");
  return Response.json({ desats, errors });
}
