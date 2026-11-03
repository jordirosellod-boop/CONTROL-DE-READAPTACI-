import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { formatDate } from "@/lib/calc";
import { getDb, getPerfil, getPlayer, getSessionDetail } from "@/lib/data";
import type { SessionExercise } from "@/lib/types";
import { InformeAccions } from "../../../informe/accions";

export async function generateMetadata({ params }: PageProps<"/jugadors/[id]/sessions/[sid]/pdf">): Promise<Metadata> {
  const { id, sid } = await params;
  const [player, session] = await Promise.all([getPlayer(id), getSessionDetail(sid)]);
  // El títol és el nom que agafa el fitxer PDF en desar-lo
  return { title: { absolute: `Sessió ${session.data} · ${player.nom} ${player.cognoms}` } };
}

const fmt = (n: number, dec = 0) => n.toLocaleString("ca-ES", { maximumFractionDigits: dec });
const temps = (s: number) => (s >= 60 && s % 60 === 0 ? `${s / 60} min` : s > 60 ? `${Math.floor(s / 60)}' ${s % 60}"` : `${s}"`);

/** Dades de l'exercici en llenguatge del jugador. */
function dades(e: SessionExercise) {
  const d: { label: string; valor: string }[] = [];
  if (e.series != null) d.push({ label: "Sèries", valor: String(e.series) });
  if (e.repeticions != null) d.push({ label: "Repeticions", valor: String(e.repeticions) });
  if (e.temps_s != null) d.push({ label: "Temps", valor: temps(e.temps_s) });
  if (e.carrega) d.push({ label: "Pes / càrrega", valor: e.carrega });
  if (e.descans_s != null) d.push({ label: "Descans", valor: temps(e.descans_s) });
  return d;
}

export default async function SessioPdf({ params }: PageProps<"/jugadors/[id]/sessions/[sid]/pdf">) {
  const { id, sid } = await params;
  const [player, session, perfil, { supabase }] = await Promise.all([getPlayer(id), getSessionDetail(sid), getPerfil(), getDb()]);
  if (session.player_id !== id) notFound();
  const exercicis = session.session_exercises;

  // Indicacions tècniques de la biblioteca
  const ids = exercicis.map((e) => e.exercise_id).filter((x): x is string => !!x);
  const { data: lib } = ids.length ? await supabase.from("ra_exercises").select("id, descripcio").in("id", ids) : { data: [] };
  const descripcio = new Map((lib ?? []).map((x) => [x.id as string, x.descripcio as string | null]));

  const fw = session.field_work;
  const camp = fw
    ? [
        { label: "Minuts de carrera", valor: fw.minuts_carrera != null ? `${fmt(Number(fw.minuts_carrera), 1)} min` : null },
        { label: "Distància", valor: fw.distancia_m != null ? `${fmt(fw.distancia_m / 1000, 2)} km` : null },
        { label: "Velocitat", valor: fw.vel_mitjana_kmh != null ? `${fmt(Number(fw.vel_mitjana_kmh), 1)} km/h` : null },
        { label: "Esprints", valor: fw.esprints != null ? String(fw.esprints) : null },
        { label: "Canvis de direcció", valor: fw.canvis_direccio != null ? String(fw.canvis_direccio) : null },
        { label: "Acceleracions", valor: fw.acceleracions != null ? String(fw.acceleracions) : null },
      ].filter((x): x is { label: string; valor: string } => x.valor != null)
    : [];
  const hiHaCamp = !!fw && (camp.length > 0 || !!fw.tipus_treball || !!fw.notes);
  const titol = `Sessió · ${player.nom} ${player.cognoms}`;

  return (
    <div className="mx-auto max-w-3xl space-y-4 print:max-w-none print:space-y-0">
      <div className="print:hidden">
        <PageHeader
          title="Fitxa per al jugador"
          subtitle="Per imprimir-la o enviar-la al jugador"
          back={{ href: `/jugadors/${id}/sessions/${sid}`, label: "Sessió" }}
          actions={<InformeAccions titol={titol} />}
        />
      </div>

      {/* Full blanc i amb poca tinta: es pot imprimir en blanc i negre */}
      <article className="rounded-3xl bg-white p-5 text-[#0b1b4d] shadow-[0_12px_40px_rgba(11,27,77,0.18)] ring-1 ring-black/5 sm:p-8 print:rounded-none print:p-0 print:shadow-none print:ring-0">
        <header className="flex items-center gap-4 border-b-4 border-[#0a2ea0] pb-4 print-avoid">
          <Image src="/escut.png" alt="" width={64} height={64} className="h-14 w-14 shrink-0 object-contain sm:h-16 sm:w-16" />
          <div className="min-w-0 flex-1">
            <p className="display text-xs tracking-wide text-[#0a2ea0]">CE Europa · Readaptació</p>
            <h1 className="display text-3xl leading-[0.95] sm:text-4xl">
              {player.nom} {player.cognoms}
              {player.dorsal != null && <span className="text-[#0a2ea0]"> #{player.dorsal}</span>}
            </h1>
            <p className="mt-1 text-sm text-[#0b1b4d]/70">
              {session.nom ? `${session.nom} · ` : ""}
              {formatDate(session.data, { weekday: "long", day: "numeric", month: "long" })}
            </p>
          </div>
        </header>

        <p className="mt-4 rounded-xl border border-[#0b1b4d]/15 px-4 py-3 text-sm print-avoid">
          Fes els exercicis en aquest ordre. Marca una casella ☐ cada vegada que acabis una sèrie. Si notes dolor, para i avisa&apos;ns.
        </p>

        {/* Exercicis */}
        <section className="mt-5">
          <h2 className="display mb-3 text-xl">Exercicis</h2>
          {exercicis.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[#0b1b4d]/25 p-4 text-center text-sm text-[#0b1b4d]/60">Aquesta sessió encara no té exercicis.</p>
          ) : (
            <ol className="space-y-3">
              {exercicis.map((e, i) => {
                const d = dades(e);
                const indicacions = [e.exercise_id ? descripcio.get(e.exercise_id) : null, e.notes].filter(Boolean) as string[];
                const caselles = Math.min(e.series ?? 0, 10);
                return (
                  <li key={e.id} className="flex flex-col gap-3 rounded-2xl border-2 border-[#0b1b4d]/12 p-3 print-avoid sm:flex-row sm:gap-4 sm:p-4 print:flex-row print:gap-4">
                    {e.imatge_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={e.imatge_url} alt={e.nom} className="max-h-56 w-full shrink-0 rounded-xl border border-[#0b1b4d]/10 object-contain sm:h-40 sm:w-48 print:h-36 print:w-44" />
                    ) : null}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start gap-2.5">
                        <span className="display grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 border-[#0a2ea0] text-sm text-[#0a2ea0]">{i + 1}</span>
                        <p className="display pt-1 text-xl leading-tight">{e.nom}</p>
                      </div>
                      {d.length > 0 && (
                        <dl className="mt-2 flex flex-wrap gap-x-5 gap-y-1.5">
                          {d.map((x) => (
                            <div key={x.label}>
                              <dt className="text-[10px] font-medium tracking-wide text-[#0b1b4d]/55 uppercase">{x.label}</dt>
                              <dd className="display text-lg leading-none">{x.valor}</dd>
                            </div>
                          ))}
                        </dl>
                      )}
                      {indicacions.map((t) => (
                        <p key={t} className="mt-2 text-sm text-[#0b1b4d]/80">
                          👉 {t}
                        </p>
                      ))}
                      {caselles > 0 && (
                        <div className="mt-2.5 flex flex-wrap items-center gap-1.5" aria-label={`${caselles} sèries per marcar`}>
                          {Array.from({ length: caselles }, (_, k) => (
                            <span key={k} className="grid h-6 w-6 place-items-center rounded-md border-2 border-[#0b1b4d]/35 text-[10px] text-[#0b1b4d]/40">
                              {k + 1}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </section>

        {/* Carrera */}
        {hiHaCamp && fw && (
          <section className="mt-5 rounded-2xl border-2 border-[#0b1b4d]/12 p-4 print-avoid">
            <h2 className="display text-xl">🏃 Carrera i treball al camp</h2>
            {fw.tipus_treball && <p className="display mt-1 text-lg text-[#0a2ea0]">{fw.tipus_treball}</p>}
            {camp.length > 0 && (
              <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-2">
                {camp.map((c) => (
                  <div key={c.label}>
                    <dt className="text-[10px] font-medium tracking-wide text-[#0b1b4d]/55 uppercase">{c.label}</dt>
                    <dd className="display text-lg leading-none">{c.valor}</dd>
                  </div>
                ))}
              </dl>
            )}
            {fw.notes && <p className="mt-2 text-sm text-[#0b1b4d]/80">👉 {fw.notes}</p>}
          </section>
        )}

        {/* Notes per al jugador */}
        {session.notes && (
          <section className="mt-5 rounded-2xl bg-[#f2f5fc] p-4 print-avoid print:border-2 print:border-[#0b1b4d]/12 print:bg-white">
            <h2 className="display text-xl">Indicacions</h2>
            <p className="mt-1 text-sm whitespace-pre-line">{session.notes}</p>
          </section>
        )}

        {/* Com t'has trobat? (per omplir a mà) */}
        <section className="mt-5 rounded-2xl border-2 border-dashed border-[#0b1b4d]/20 p-4 print-avoid">
          <h2 className="display text-lg">Com t&apos;has trobat? Encercla-ho</h2>
          <div className="mt-2 grid gap-4 text-sm sm:grid-cols-2 print:grid-cols-2">
            <div>
              <p className="mb-1 text-[#0b1b4d]/70">Esforç (1 = molt fàcil · 10 = màxim)</p>
              <div className="flex flex-wrap gap-1">
                {Array.from({ length: 10 }, (_, k) => (
                  <span key={k} className="display grid h-6 w-6 place-items-center rounded-full border border-[#0b1b4d]/30 text-xs">
                    {k + 1}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-1 text-[#0b1b4d]/70">Dolor (0 = gens · 10 = màxim)</p>
              <div className="flex flex-wrap gap-1">
                {Array.from({ length: 11 }, (_, k) => (
                  <span key={k} className="display grid h-6 w-6 place-items-center rounded-full border border-[#0b1b4d]/30 text-xs">
                    {k}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <footer className="mt-5 flex items-end justify-between gap-4 border-t border-[#0b1b4d]/15 pt-3 text-xs text-[#0b1b4d]/60 print-avoid">
          <p>
            Preparat per <span className="display text-sm text-[#0b1b4d]">{perfil.nom}</span> · Readaptació CE Europa
          </p>
          <p className="display text-sm text-[#0a2ea0]">Força Europa! 💙</p>
        </footer>
      </article>
    </div>
  );
}
