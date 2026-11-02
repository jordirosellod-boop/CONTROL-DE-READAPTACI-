// Cua de registres fets sense connexió (es guarda al mòbil fins que es poden enviar).
export interface ElementCua {
  id: string;
  tipus: "wellness";
  playerId: string;
  camps: Record<string, string | string[]>;
  creat: string;
}

const CLAU = "ra-cua";

export function llegeixCua(): ElementCua[] {
  try {
    return JSON.parse(localStorage.getItem(CLAU) ?? "[]") as ElementCua[];
  } catch {
    return [];
  }
}

function desaCua(cua: ElementCua[]) {
  try {
    localStorage.setItem(CLAU, JSON.stringify(cua));
  } catch {}
  window.dispatchEvent(new Event("ra-cua"));
}

/** Converteix un formulari en un objecte (els camps repetits, com les zones, en llista). */
export function campsDe(fd: FormData): Record<string, string | string[]> {
  const out: Record<string, string | string[]> = {};
  for (const [k, v] of fd.entries()) {
    if (typeof v !== "string") continue;
    const prev = out[k];
    out[k] = prev === undefined ? v : Array.isArray(prev) ? [...prev, v] : [prev, v];
  }
  return out;
}

export function afegeixACua(el: Omit<ElementCua, "id" | "creat">) {
  desaCua([...llegeixCua(), { ...el, id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, creat: new Date().toISOString() }]);
}

/** Envia la cua al servidor; retorna quants s'han desat. */
export async function enviaCua(): Promise<number> {
  const cua = llegeixCua();
  if (!cua.length || !navigator.onLine) return 0;
  const resp = await fetch("/api/cua", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(cua) });
  if (!resp.ok) return 0;
  const { desats } = (await resp.json()) as { desats: string[] };
  desaCua(llegeixCua().filter((e) => !desats.includes(e.id)));
  return desats.length;
}
