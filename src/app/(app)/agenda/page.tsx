import type { Metadata } from "next";
import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { LinkButton, PageHeader, cx } from "@/components/ui";
import { addDays, dillunsDe, formatDate, todayISO } from "@/lib/calc";
import { getDb, getPlayersLite } from "@/lib/data";

export const metadata: Metadata = { title: "Agenda" };

interface FilaSessio {
  id: string;
  player_id: string;
  data: string;
  nom: string | null;
  completada: boolean;
  rpe: number | null;
  durada_min: number | null;
  ra_players: { nom: string; cognoms: string; foto_url: string | null; dorsal: number | null; arxivat: boolean } | null;
  session_exercises: { id: string }[];
}

export default async function Agenda({ searchParams }: PageProps<"/agenda">) {
  const sp = await searchParams;
  const avui = todayISO();
  const base = typeof sp.setmana === "string" && /^\d{4}-\d{2}-\d{2}$/.test(sp.setmana) ? sp.setmana : avui;
  const dilluns = dillunsDe(base);
  const diumenge = addDays(dilluns, 6);
  const dies = Array.from({ length: 7 }, (_, i) => addDays(dilluns, i));

  const { supabase } = await getDb();
  const [{ data, error }, jugadors] = await Promise.all([
    supabase
      .from("ra_sessions")
      .select("id, player_id, data, nom, completada, rpe, durada_min, ra_players(nom, cognoms, foto_url, dorsal, arxivat), session_exercises:ra_session_exercises(id)")
      .gte("data", dilluns)
      .lte("data", diumenge)
      .order("data")
      .order("created_at"),
    getPlayersLite(),
  ]);
  if (error) throw new Error(error.message);
  const sessions = ((data ?? []) as unknown as FilaSessio[]).filter((s) => !s.ra_players?.arxivat);
  const fetes = sessions.filter((s) => s.completada).length;
  const esAquesta = dilluns === dillunsDe(avui);

  return (
    <>
      <PageHeader
        title="Agenda"
        subtitle={`${formatDate(dilluns, { day: "numeric", month: "short" })} – ${formatDate(diumenge, { day: "numeric", month: "short", year: "numeric" })} · ${sessions.length} sessions${sessions.length ? `, ${fetes} fetes` : ""}`}
      />
      <div className="mb-4 flex items-center gap-2">
        <LinkButton href={`/agenda?setmana=${addDays(dilluns, -7)}`} variant="secondary" size="sm" aria-label="Setmana anterior">
          ‹ Anterior
        </LinkButton>
        {!esAquesta && (
          <LinkButton href="/agenda" variant="ghost" size="sm">
            Avui
          </LinkButton>
        )}
        <LinkButton href={`/agenda?setmana=${addDays(dilluns, 7)}`} variant="secondary" size="sm" className="ml-auto" aria-label="Setmana següent">
          Següent ›
        </LinkButton>
      </div>

      <ol className="grid gap-3 lg:grid-cols-7 lg:gap-2">
        {dies.map((dia) => {
          const delDia = sessions.filter((s) => s.data === dia);
          const esAvui = dia === avui;
          return (
            <li key={dia} className={cx("rounded-2xl border bg-surface p-3 lg:min-h-48", esAvui ? "border-accent ring-2 ring-accent/30" : "border-border", dia < avui && delDia.length === 0 && "opacity-60")}>
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className={cx("display text-base leading-none", esAvui ? "text-accent" : "text-heading")}>
                  {formatDate(dia, { weekday: "long" })}
                  <span className="ml-1.5 text-muted">{formatDate(dia, { day: "numeric" })}</span>
                  {esAvui && <span className="ml-1.5 rounded-full bg-accent px-1.5 py-0.5 text-[10px] text-accent-fg">AVUI</span>}
                </p>
                {jugadors.length > 0 && (
                  <details className="relative">
                    <summary className="display cursor-pointer list-none rounded-full px-2 py-0.5 text-sm text-accent hover:bg-accent-soft" aria-label={`Planificar una sessió el ${formatDate(dia, { weekday: "long", day: "numeric" })}`}>
                      + Planificar
                    </summary>
                    <ul className="absolute right-0 z-20 mt-1 max-h-64 w-56 overflow-auto rounded-xl border border-border bg-surface p-1 shadow-lg">
                      {jugadors.map((j) => (
                        <li key={j.id}>
                          <Link href={`/jugadors/${j.id}/sessions/nova?data=${dia}&des=agenda`} className="block rounded-lg px-2.5 py-2 text-sm hover:bg-surface-2">
                            {j.nom} {j.cognoms}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
              {delDia.length === 0 ? (
                <p className="text-xs text-muted">Cap sessió</p>
              ) : (
                <ul className="space-y-1.5">
                  {delDia.map((s) => (
                    <li key={s.id}>
                      <Link
                        href={`/jugadors/${s.player_id}/sessions/${s.id}`}
                        className={cx("flex items-center gap-2 rounded-xl border px-2 py-2 transition active:scale-[0.98]", s.completada ? "border-ok/30 bg-ok/8" : "border-border hover:bg-surface-2")}
                      >
                        {s.ra_players && <Avatar nom={s.ra_players.nom} cognoms={s.ra_players.cognoms} foto={s.ra_players.foto_url} dorsal={null} size="sm" />}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">
                            {s.ra_players ? `${s.ra_players.nom} ${s.ra_players.cognoms}` : "—"}
                          </span>
                          <span className="block truncate text-xs text-muted">
                            {[s.nom, s.session_exercises.length ? `${s.session_exercises.length} ex.` : null, s.durada_min ? `${s.durada_min}'` : null].filter(Boolean).join(" · ") || "Sessió"}
                          </span>
                        </span>
                        {s.completada ? (
                          <span className="shrink-0 text-xs font-semibold text-ok" title="Feta">
                            ✓{s.rpe != null ? ` ${Number(s.rpe)}` : ""}
                          </span>
                        ) : dia < avui ? (
                          <span className="shrink-0 text-xs text-warn" title="Pendent">
                            ●
                          </span>
                        ) : null}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ol>
      <p className="mt-3 text-xs text-muted">✓ feta (amb l&apos;RPE) · ● d&apos;un dia passat i encara no marcada com a feta</p>
    </>
  );
}
