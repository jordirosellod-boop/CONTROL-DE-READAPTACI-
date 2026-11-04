import type { Metadata } from "next";
import Image from "next/image";
import { LinkButton, PageHeader, cx } from "@/components/ui";
import { addDays, dillunsDe, formatDate, formatPct, summarizeTests, todayISO, treatmentWeek, wellnessScore } from "@/lib/calc";
import { FASES } from "@/lib/constants";
import { activeInjury, getPerfil, getPlayerBundle } from "@/lib/data";
import { InformeAccions } from "../informe/accions";

export const metadata: Metadata = { title: "Resum setmanal" };

const mitjana = (v: number[]) => (v.length ? v.reduce((a, b) => a + b, 0) / v.length : null);
const un = (n: number) => n.toLocaleString("ca-ES", { maximumFractionDigits: 1 });

export default async function ResumSetmanal({ params, searchParams }: PageProps<"/jugadors/[id]/setmana">) {
  const { id } = await params;
  const sp = await searchParams;
  const avui = todayISO();
  const base = typeof sp.d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(sp.d) ? sp.d : avui;
  const dilluns = dillunsDe(base);
  const diumenge = addDays(dilluns, 6);
  const dies = Array.from({ length: 7 }, (_, i) => addDays(dilluns, i));
  const [{ player, injuries, wellness, sessions, tests }, perfil] = await Promise.all([getPlayerBundle(id), getPerfil()]);
  const injury = activeInjury(injuries);
  const dins = (d: string, a: string, b: string) => d >= a && d <= b;

  // Aquesta setmana i l'anterior
  const sFetes = sessions.filter((s) => s.completada && dins(s.data, dilluns, diumenge)).sort((a, b) => a.data.localeCompare(b.data));
  const sAnt = sessions.filter((s) => s.completada && dins(s.data, addDays(dilluns, -7), addDays(dilluns, -1)));
  const minuts = sFetes.reduce((a, s) => a + (s.durada_min ?? 0), 0);
  const minutsAnt = sAnt.reduce((a, s) => a + (s.durada_min ?? 0), 0);
  const km = sFetes.reduce((a, s) => a + (s.field_work?.distancia_m ?? 0), 0) / 1000;
  const wSet = wellness.filter((w) => dins(w.data, dilluns, diumenge));
  const wAnt = wellness.filter((w) => dins(w.data, addDays(dilluns, -7), addDays(dilluns, -1)));
  const dolor = mitjana(wSet.map((w) => w.dolor_eva));
  const dolorAnt = mitjana(wAnt.map((w) => w.dolor_eva));
  const benestar = mitjana(wSet.map(wellnessScore));
  const benestarAnt = mitjana(wAnt.map(wellnessScore));

  // Tests fets aquesta setmana, comparats amb el primer registre
  const millores = summarizeTests(tests.filter((t) => t.data <= diumenge))
    .flatMap((t) => t.costats.filter((c) => c.mesures > 1 && dins(c.actualData, dilluns, diumenge) && c.pct != null).map((c) => ({ t, c })))
    .map(({ t, c }) => ({
      nom: `${t.nom}${c.costat === "lesionat" ? " (cama lesionada)" : c.costat === "sa" ? " (cama sana)" : ""}`,
      pct: c.pct!,
      millor: t.millorSi === "mes" ? c.pct! > 0 : c.pct! < 0,
    }))
    .filter((m) => m.millor); // per al jugador, només les millores

  const fase = injury ? (injury.fase ?? 1) : null;
  const setmana = injury ? treatmentWeek(injury, diumenge < avui ? diumenge : avui).setmana : null;

  // Missatge automàtic segons l'evolució
  const frases: string[] = [];
  if (sFetes.length >= 3) frases.push(`Has completat ${sFetes.length} sessions aquesta setmana. Constància de campió!`);
  else if (sFetes.length > 0) frases.push(`Has fet ${sFetes.length} ${sFetes.length === 1 ? "sessió" : "sessions"} aquesta setmana.`);
  if (dolor != null && dolorAnt != null && dolor < dolorAnt - 0.4) frases.push("El dolor ha baixat respecte la setmana passada. Anem molt bé!");
  if (benestar != null && benestarAnt != null && benestar > benestarAnt + 0.9) frases.push("Et trobes millor que la setmana passada.");
  if (millores.some((m) => m.millor)) frases.push("Els tests mostren millores respecte l'inici. Seguim així!");
  if (frases.length === 0) frases.push("Cada setmana compta. Seguim treballant junts!");

  const titol = `Resum setmanal · ${player.nom} ${player.cognoms}`;
  const xifres = [
    { label: "Sessions", valor: String(sFetes.length), ant: sAnt.length ? `${sAnt.length} la setmana passada` : null },
    { label: "Minuts entrenats", valor: String(minuts), ant: minutsAnt ? `${minutsAnt} la setmana passada` : null },
    { label: "Dolor mitjà", valor: dolor != null ? `${un(dolor)}/10` : "—", ant: dolorAnt != null ? `${un(dolorAnt)} la setmana passada` : null },
    { label: "Dies amb wellness", valor: `${wSet.length}/7`, ant: null },
  ];
  const maxBarra = 25;

  return (
    <div className="mx-auto max-w-3xl space-y-4 print:max-w-none print:space-y-0">
      <div className="space-y-3 print:hidden">
        <PageHeader title="Resum setmanal" subtitle="Per enviar-lo al jugador" back={{ href: `/jugadors/${id}`, label: "Fitxa" }} actions={<InformeAccions titol={titol} />} />
        <div className="flex items-center gap-2">
          <LinkButton href={`/jugadors/${id}/setmana?d=${addDays(dilluns, -7)}`} variant="secondary" size="sm">
            ‹ Anterior
          </LinkButton>
          <LinkButton href={`/jugadors/${id}/setmana?d=${addDays(dilluns, 7)}`} variant="secondary" size="sm" className="ml-auto">
            Següent ›
          </LinkButton>
        </div>
      </div>

      <article className="rounded-3xl bg-white p-5 text-[#0b1b4d] shadow-[0_12px_40px_rgba(11,27,77,0.18)] ring-1 ring-black/5 sm:p-8 print:rounded-none print:p-0 print:shadow-none print:ring-0">
        <header className="flex items-center gap-4 border-b-4 border-[#0a2ea0] pb-4 print-avoid">
          <Image src="/escut.png" alt="" width={64} height={64} className="h-14 w-14 shrink-0 object-contain sm:h-16 sm:w-16" />
          <div className="min-w-0 flex-1">
            <p className="display text-xs tracking-wide text-[#0a2ea0]">CE Europa · Readaptació · Resum setmanal</p>
            <h1 className="display text-3xl leading-[0.95] sm:text-4xl">
              {player.nom} {player.cognoms}
              {player.dorsal != null && <span className="text-[#0a2ea0]"> #{player.dorsal}</span>}
            </h1>
            <p className="mt-1 text-sm text-[#0b1b4d]/70">
              Setmana del {formatDate(dilluns, { day: "numeric", month: "long" })} al {formatDate(diumenge, { day: "numeric", month: "long" })}
            </p>
          </div>
        </header>

        {/* Missatge */}
        <div className="mt-5 rounded-2xl bg-[#f2f5fc] p-4 print-avoid print:border-2 print:border-[#0b1b4d]/12 print:bg-white">
          {frases.map((f) => (
            <p key={f} className="display text-lg leading-snug">
              💙 {f}
            </p>
          ))}
        </div>

        {/* Xifres */}
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 print:grid-cols-4 print-avoid">
          {xifres.map((x) => (
            <div key={x.label} className="rounded-2xl border-2 border-[#0b1b4d]/10 p-3 text-center">
              <p className="display text-3xl leading-none text-[#0a2ea0]">{x.valor}</p>
              <p className="mt-1 text-[11px] font-medium tracking-wide text-[#0b1b4d]/60 uppercase">{x.label}</p>
              {x.ant && <p className="mt-0.5 text-[10px] text-[#0b1b4d]/45">{x.ant}</p>}
            </div>
          ))}
        </div>

        {/* Camí de retorn */}
        {injury && fase && (
          <section className="mt-5 print-avoid">
            <h2 className="display mb-2 text-xl">El teu camí de tornada</h2>
            <div className="flex gap-1">
              {FASES.map((f) => (
                <div key={f.n} className="min-w-0 flex-1">
                  <div className={cx("h-2.5 rounded-full", f.n < fase ? "bg-[#0a2ea0]" : f.n === fase ? "bg-[#e0b36e]" : "bg-[#0b1b4d]/10")} />
                  <p className={cx("mt-1 truncate text-[10px] sm:text-xs", f.n === fase ? "display text-[#0b1b4d]" : "text-[#0b1b4d]/50")}>{f.curt}</p>
                </div>
              ))}
            </div>
            <p className="mt-2 text-sm text-[#0b1b4d]/75">
              Ets a la <strong>fase {fase} ({FASES[fase - 1].nom.toLowerCase()})</strong>
              {setmana ? `, setmana ${setmana} de readaptació` : ""}
              {injury.data_prevista ? `. Objectiu de tornada: ${formatDate(injury.data_prevista, { day: "numeric", month: "long" })}` : ""}.
            </p>
          </section>
        )}

        {/* Dia a dia */}
        <section className="mt-5 print-avoid">
          <h2 className="display mb-2 text-xl">Dia a dia</h2>
          <div className="grid grid-cols-7 gap-1.5">
            {dies.map((d) => {
              const w = wSet.find((x) => x.data === d);
              const fet = sFetes.filter((s) => s.data === d);
              const punts = w ? wellnessScore(w) : null;
              return (
                <div key={d} className="text-center">
                  <p className="display text-[11px] text-[#0b1b4d]/60 uppercase">{formatDate(d, { weekday: "short" }).replace(".", "")}</p>
                  <div className="mx-auto mt-1 flex h-20 w-full max-w-10 items-end overflow-hidden rounded-lg bg-[#0b1b4d]/5">
                    {punts != null && (
                      <div
                        className={cx("w-full rounded-lg", punts >= 18 ? "bg-[#2e9e5b]" : punts >= 13 ? "bg-[#d9a520]" : "bg-[#c13626]")}
                        style={{ height: `${Math.max(8, (punts / maxBarra) * 100)}%` }}
                        title={`Wellness ${punts}/25`}
                      />
                    )}
                  </div>
                  <p className="mt-1 text-[10px] text-[#0b1b4d]/60">{w ? `Dolor ${w.dolor_eva}` : "—"}</p>
                  <p className="text-sm leading-none">{fet.length ? "💪" : " "}</p>
                </div>
              );
            })}
          </div>
          <p className="mt-2 text-[11px] text-[#0b1b4d]/55">Barra: com et trobaves (wellness, com més alta millor) · 💪 dia amb sessió</p>
        </section>

        {/* Tests */}
        {millores.length > 0 && (
          <section className="mt-5 print-avoid">
            <h2 className="display mb-2 text-xl">Millores als tests</h2>
            <ul className="space-y-1.5">
              {millores.map((m) => (
                <li key={m.nom} className="flex items-center justify-between gap-3 rounded-xl border-2 border-[#0b1b4d]/10 px-3 py-2">
                  <span className="text-sm font-medium">{m.nom}</span>
                  <span className={cx("display text-lg", m.millor ? "text-[#2e9e5b]" : "text-[#0b1b4d]/60")}>
                    {m.millor ? "▲ " : ""}
                    {formatPct(m.pct)} <span className="text-xs font-normal text-[#0b1b4d]/50">vs l&apos;inici</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Sessions */}
        {sFetes.length > 0 && (
          <section className="mt-5 print-avoid">
            <h2 className="display mb-2 text-xl">Sessions fetes</h2>
            <ul className="divide-y divide-[#0b1b4d]/10 rounded-2xl border-2 border-[#0b1b4d]/10">
              {sFetes.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                  <span className="min-w-0 truncate">
                    <span className="text-[#0b1b4d]/55">{formatDate(s.data, { weekday: "short", day: "numeric" })} · </span>
                    {s.nom || "Sessió de readaptació"}
                  </span>
                  <span className="shrink-0 text-[#0b1b4d]/70">{s.durada_min ? `${s.durada_min}'` : ""}</span>
                </li>
              ))}
            </ul>
            {km > 0 && <p className="mt-2 text-sm text-[#0b1b4d]/70">🏃 Has corregut {un(km)} km aquesta setmana.</p>}
          </section>
        )}

        <footer className="mt-6 flex items-end justify-between gap-4 border-t border-[#0b1b4d]/15 pt-3 text-xs text-[#0b1b4d]/60 print-avoid">
          <p>
            Preparat per <span className="display text-sm text-[#0b1b4d]">{perfil.nom}</span> · Readaptació CE Europa
          </p>
          <p className="display text-sm text-[#0a2ea0]">Força Europa! 💙</p>
        </footer>
      </article>
    </div>
  );
}
