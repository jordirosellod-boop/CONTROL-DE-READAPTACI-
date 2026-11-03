import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/avatar";
import { PageHeader } from "@/components/ui";
import { formatDate, sessionLoad, treatmentWeek } from "@/lib/calc";
import { FASES, POSICIONS, labelOf } from "@/lib/constants";
import { getDb, getPerfil, getPlayer, getSessionDetail } from "@/lib/data";
import type { Injury, SessionExercise } from "@/lib/types";
import { InformeAccions } from "../../../informe/accions";

export async function generateMetadata({ params }: PageProps<"/jugadors/[id]/sessions/[sid]/pdf">): Promise<Metadata> {
  const { id, sid } = await params;
  const [player, session] = await Promise.all([getPlayer(id), getSessionDetail(sid)]);
  // El títol és el nom que agafa el fitxer PDF en desar-lo
  return { title: { absolute: `Sessió ${session.data} · ${player.nom} ${player.cognoms}` } };
}

const fmt = (n: number, dec = 0) => n.toLocaleString("ca-ES", { maximumFractionDigits: dec });

function volum(e: SessionExercise) {
  if (e.series != null && e.repeticions != null) return `${e.series} × ${e.repeticions}`;
  if (e.series != null && e.temps_s != null) return `${e.series} × ${e.temps_s}"`;
  if (e.repeticions != null) return `${e.repeticions} reps`;
  if (e.temps_s != null) return `${e.temps_s}"`;
  if (e.series != null) return `${e.series} sèries`;
  return null;
}

export default async function SessioPdf({ params }: PageProps<"/jugadors/[id]/sessions/[sid]/pdf">) {
  const { id, sid } = await params;
  const [player, session, perfil, { supabase }] = await Promise.all([getPlayer(id), getSessionDetail(sid), getPerfil(), getDb()]);
  if (session.player_id !== id) notFound();
  const { data: injuryData } = session.injury_id
    ? await supabase.from("ra_injuries").select("*").eq("id", session.injury_id).maybeSingle()
    : await supabase.from("ra_injuries").select("*").eq("player_id", id).lte("data_lesio", session.data).order("data_lesio", { ascending: false }).limit(1).maybeSingle();
  const injury = injuryData as Injury | null;
  const setmana = injury ? treatmentWeek(injury, session.data).setmana : null;
  const fase = injury?.fase ? FASES[injury.fase - 1] : null;
  const fw = session.field_work;
  const carrega = sessionLoad(session);
  const exercicis = session.session_exercises;
  const titol = `Sessió de readaptació · ${player.nom} ${player.cognoms}`;

  const resum = [
    { label: "Durada", valor: session.durada_min != null ? `${session.durada_min}'` : "—" },
    { label: "RPE", valor: session.rpe != null ? fmt(Number(session.rpe), 1) : "—" },
    { label: "Càrrega", valor: carrega ? `${fmt(carrega)} UA` : "—" },
    { label: "Exercicis", valor: String(exercicis.length) },
  ];

  const camp = fw
    ? [
        { label: "Carrera", valor: fw.minuts_carrera != null ? `${fmt(Number(fw.minuts_carrera), 1)} min` : null },
        { label: "Distància", valor: fw.distancia_m != null ? `${fmt(fw.distancia_m / 1000, 2)} km` : null },
        { label: "Vel. màx.", valor: fw.vel_max_kmh != null ? `${fmt(Number(fw.vel_max_kmh), 1)} km/h` : null },
        { label: "Vel. mitjana", valor: fw.vel_mitjana_kmh != null ? `${fmt(Number(fw.vel_mitjana_kmh), 1)} km/h` : null },
        { label: "Esprints", valor: fw.esprints != null ? String(fw.esprints) : null },
        { label: "Acceleracions", valor: fw.acceleracions != null ? String(fw.acceleracions) : null },
        { label: "Desacceleracions", valor: fw.desacceleracions != null ? String(fw.desacceleracions) : null },
        { label: "Canvis de direcció", valor: fw.canvis_direccio != null ? String(fw.canvis_direccio) : null },
      ].filter((x): x is { label: string; valor: string } => x.valor != null)
    : [];

  return (
    <div className="mx-auto max-w-3xl space-y-4 print:max-w-none print:space-y-3">
      <div className="print:hidden">
        <PageHeader
          title="PDF de la sessió"
          subtitle="Desa-la en PDF o comparteix-la amb el jugador i el cos tècnic"
          back={{ href: `/jugadors/${id}/sessions/${sid}`, label: "Sessió" }}
          actions={<InformeAccions titol={titol} />}
        />
      </div>

      <article className="overflow-hidden rounded-3xl bg-white text-[#0b1b4d] shadow-[0_12px_40px_rgba(11,27,77,0.18)] ring-1 ring-black/5 print:rounded-none print:shadow-none print:ring-0">
        {/* Capçalera */}
        <header className="stripes relative overflow-hidden bg-brand px-6 pt-6 pb-16 text-white print-avoid">
          <div aria-hidden className="absolute inset-0 bg-[radial-gradient(120%_90%_at_100%_100%,rgba(11,27,77,0.85),transparent_60%)]" />
          <div className="relative flex items-start gap-4">
            <Image src="/escut.png" alt="" width={64} height={64} className="h-16 w-16 shrink-0 object-contain drop-shadow" />
            <div className="min-w-0 flex-1">
              <p className="display text-xs tracking-wide text-[#e0b36e]">CE Europa · Servei de readaptació</p>
              <h1 className="display mt-0.5 text-3xl leading-[0.95] sm:text-4xl">{session.nom || "Sessió de readaptació"}</h1>
              <p className="mt-1.5 text-sm text-white/80">{formatDate(session.data, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
            </div>
            {session.completada && <span className="display shrink-0 rounded-full bg-[#e0b36e] px-3 py-1 text-xs text-[#0b1b4d]">✓ Feta</span>}
          </div>
        </header>

        {/* Jugador */}
        <div className="relative -mt-10 px-5 print-avoid">
          <div className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-[0_8px_24px_rgba(11,27,77,0.14)] ring-1 ring-black/5 print:shadow-none print:ring-[#0b1b4d]/15">
            <Avatar nom={player.nom} cognoms={player.cognoms} foto={player.foto_url} dorsal={player.dorsal} size="lg" />
            <div className="min-w-0 flex-1">
              <p className="display text-2xl leading-none">
                {player.nom} {player.cognoms}
              </p>
              <p className="mt-1 truncate text-sm text-[#0b1b4d]/65">
                {[player.equip, player.posicio ? labelOf(POSICIONS, player.posicio) : null].filter(Boolean).join(" · ")}
              </p>
              {injury && (
                <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
                  <span className="rounded-full bg-[#0a2ea0]/8 px-2.5 py-1 font-medium">{injury.diagnostic}</span>
                  {fase && <span className="display rounded-full bg-[#e0b36e]/30 px-2.5 py-1">Fase {fase.n} · {fase.curt}</span>}
                  {setmana != null && <span className="display rounded-full bg-[#0a2ea0]/8 px-2.5 py-1">Setmana {setmana}</span>}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6 px-5 pt-5 pb-6 sm:px-6">
          {/* Resum */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 print:grid-cols-4 print-avoid">
            {resum.map((r) => (
              <div key={r.label} className="rounded-2xl bg-[#f2f5fc] px-2 py-3 text-center">
                <p className="display text-2xl leading-none text-[#0a2ea0] sm:text-3xl">{r.valor}</p>
                <p className="mt-1 text-[11px] font-medium tracking-wide text-[#0b1b4d]/60 uppercase">{r.label}</p>
              </div>
            ))}
          </div>

          {/* Exercicis */}
          <section>
            <h2 className="display mb-3 flex items-center gap-2 text-xl">
              <span className="h-5 w-1.5 rounded-full bg-[#e0b36e]" /> Exercicis
            </h2>
            {exercicis.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-[#0b1b4d]/20 p-4 text-center text-sm text-[#0b1b4d]/60">Aquesta sessió no té exercicis.</p>
            ) : (
              <ol className="pdf-graella grid gap-3 sm:grid-cols-2">
                {exercicis.map((e, i) => {
                  const xips = [volum(e), e.carrega, e.descans_s != null ? `Desc. ${e.descans_s}"` : null, e.rpe != null ? `RPE ${fmt(Number(e.rpe), 1)}` : null].filter(Boolean) as string[];
                  return (
                    <li key={e.id} className="overflow-hidden rounded-2xl border border-[#0b1b4d]/12 bg-white print-avoid">
                      {e.imatge_url ? (
                        <div className="relative flex aspect-[4/3] items-center justify-center bg-[#f2f5fc] print:aspect-[16/10]">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={e.imatge_url} alt={e.nom} className="h-full w-full object-contain" />
                          <span className="display absolute top-2 left-2 grid h-8 w-8 place-items-center rounded-full bg-[#0a2ea0] text-sm text-white shadow">{i + 1}</span>
                        </div>
                      ) : null}
                      <div className="p-3.5">
                        <div className="flex items-start gap-2.5">
                          {!e.imatge_url && <span className="display grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#0a2ea0] text-sm text-white">{i + 1}</span>}
                          <p className="display pt-1 text-lg leading-tight">{e.nom}</p>
                        </div>
                        {xips.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {xips.map((x) => (
                              <span key={x} className="display rounded-lg bg-[#0a2ea0]/8 px-2 py-1 text-xs text-[#0a2ea0]">
                                {x}
                              </span>
                            ))}
                          </div>
                        )}
                        {e.notes && <p className="mt-2 text-sm text-[#0b1b4d]/70">{e.notes}</p>}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>

          {/* Treball de camp */}
          {fw && (camp.length > 0 || fw.tipus_treball || fw.notes) && (
            <section className="print-avoid">
              <h2 className="display mb-3 flex items-center gap-2 text-xl">
                <span className="h-5 w-1.5 rounded-full bg-[#e0b36e]" /> Carrera i treball de camp
              </h2>
              <div className="rounded-2xl bg-[#0b1b4d] p-4 text-white">
                {fw.tipus_treball && <p className="display mb-3 text-lg text-[#e0b36e]">{fw.tipus_treball}</p>}
                {camp.length > 0 && (
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
                    {camp.map((c) => (
                      <div key={c.label}>
                        <p className="display text-xl leading-none">{c.valor}</p>
                        <p className="mt-0.5 text-[11px] tracking-wide text-white/60 uppercase">{c.label}</p>
                      </div>
                    ))}
                  </div>
                )}
                {fw.notes && <p className="mt-3 text-sm text-white/80">{fw.notes}</p>}
              </div>
            </section>
          )}

          {/* Notes */}
          {session.notes && (
            <section className="print-avoid">
              <h2 className="display mb-2 flex items-center gap-2 text-xl">
                <span className="h-5 w-1.5 rounded-full bg-[#e0b36e]" /> Observacions
              </h2>
              <p className="rounded-2xl bg-[#f2f5fc] p-4 text-sm whitespace-pre-line">{session.notes}</p>
            </section>
          )}

          {/* Peu */}
          <footer className="flex items-end justify-between gap-4 border-t border-[#0b1b4d]/10 pt-4 text-xs text-[#0b1b4d]/60 print-avoid">
            <div>
              <p className="display text-sm text-[#0b1b4d]">{perfil.nom}</p>
              <p>Readaptació · CE Europa</p>
            </div>
            <p className="display text-right text-[#0a2ea0]">Força Europa! 💙</p>
          </footer>
        </div>
      </article>
    </div>
  );
}
