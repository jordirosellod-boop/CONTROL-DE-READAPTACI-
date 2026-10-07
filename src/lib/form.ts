// Utilitats per llegir valors de FormData de manera segura.

export type FormState = { error?: string; ok?: string; ts?: number } | undefined;

export function str(fd: FormData, key: string): string | null {
  const v = fd.get(key);
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t === "" ? null : t;
}

export function num(fd: FormData, key: string): number | null {
  const s = str(fd, key);
  if (s == null) return null;
  const n = Number(s.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

export function int(fd: FormData, key: string): number | null {
  const n = num(fd, key);
  return n == null ? null : Math.round(n);
}

export function bool(fd: FormData, key: string): boolean {
  const v = fd.get(key);
  return v === "on" || v === "true" || v === "1";
}

export function list(fd: FormData, key: string): string[] {
  return fd.getAll(key).filter((v): v is string => typeof v === "string" && v !== "");
}

/** Missatge d'error comprensible a partir d'un error de Postgres/Supabase. */
export function dbError(error: { message: string; code?: string } | null): string {
  if (!error) return "Error desconegut";
  if (error.code === "23514") return "Algun valor està fora del rang permès. Revisa el formulari.";
  if (error.code === "23505") return "Ja existeix un registre amb aquestes dades (p. ex. un wellness per a aquest dia).";
  if (error.code === "42501") return "No tens permís per fer aquesta acció.";
  return `No s'ha pogut desar: ${error.message}`;
}
