import type { Metadata } from "next";
import Image from "next/image";
import { Avatar } from "@/components/avatar";
import { BodyMap } from "@/components/body-map";
import { RtpTimeline } from "@/components/rtp";
import { AcwrBadge, Card, Empty, PageHeader, SemaforBadge, Stat } from "@/components/ui";
import {
  fatigueMetrics,
  formatDate,
  formatPct,
  mapaDolor,
  rtpCompteEnrere,
  rtpProgress,
  sessionLoad,
  summarizeTests,
  todayISO,
  treatmentWeek,
  wellnessScore,
  wellnessStatus,
} from "@/lib/calc";
import { CATEGORIES_LESIO, COSTATS_LESIO, COSTATS_TEST, POSICIONS, TECNIQUES, labelOf } from "@/lib/constants";
import { activeInjury, getPerfil, getPlayerBundle } from "@/lib/data";
import { InformeAccions } from "./accions";

export const metadata: Metadata = { title: "Informe" };

export default async function Informe({ params }: PageProps<"/jugadors/[id]/informe">) {
  const { id } = await params;
  const [{ player, injuries, wellness, sessions, tests, treatments }, perfil] = await Promise.all([getPlayerBundle(id), getPerfil()]);
  const today = todayISO();
  const injury = activeInjury(injuries);
  const desde = injury?.data_lesio ?? "0000-00-00";
  const week = injury ? treatmentWeek(injury, today) : null;
  const rtp = injury ? rtpProgress(injury, today) : null;
  const avui = wellness.find((w) => w.data === today) ?? wellness[0] ?? null;
  const fatiga = fatigueMetrics(sessions, today);
  const resumTests = summarizeTests(tests.filter((t) => t.data >= desde || t.es_baseline));
  const dolor = mapaDolor(wellness, today);
  const tractaments = treatments.filter((t) => t.data >= desde).slice(0, 5);
  const sessionsFetes = sessions.filter((s) => s.completada && s.data >= desde);
  const titol = `Informe de readaptació · ${player.nom} ${player.cognoms}`;

  return (
    <div className="mx-auto max-w-3xl space-y-4 print:space-y-3">
      <div className="print:hidden">
        <PageHeader title="Informe" subtitle="Per desar en PDF o compartir amb el cos mèdic i tècnic" back={{ href: `/jugadors/${id}`, label: "Fitxa" }} actions={<InformeAccions titol={titol} />} />
      </div>

      {/* Capçalera de l'informe */}
      <header className="stripes print-avoid flex items-center gap-4 rounded-2xl bg-brand p-5 text-brand-fg">
        <Image src="/escut.png" alt="" width={56} height={56} className="h-14 w-14 object-contain" />
        <div className="min-w-0 flex-1">
          <p className="display text-sm text-[#e0b36e]">CE Europa · Servei de readaptació</p>
          <h1 className="display text-2xl leading-tight">Informe de readaptació</h1>
          <p className="text-xs text-brand-fg/80">
            {formatDate(today, { day: "numeric", month: "long", year: "numeric" })} · Elaborat per {perfil.nom}
          </p>
        </div>
      </header>

      <Card className="print-avoid">
        <div className="flex items-center gap-4">
          <Avatar nom={player.nom} cognoms={player.cognoms} foto={player.foto_url} dorsal={player.dorsal} size="lg" />
          <div className="min-w-0">
            <p className="display text-3xl leading-none text-heading">
              {player.nom} {player.cognoms}
            </p>
            <p className="mt-1 text-sm text-muted">{[player.equip, player.posicio ? labelOf(POSICIONS, player.posicio) : null, player.edat ? `${player.edat} anys` : null].filter(Boolean).join(" · ")}</p>
          </div>
        </div>
      </Card>

      <Card title="Lesió" className="print-avoid">
        {injury ? (
          <>
            <p className="display text-xl text-heading">{injury.diagnostic}</p>
            <p className="text-sm text-muted">
              {[labelOf(CATEGORIES_LESIO, injury.categoria), injury.zona, injury.costat && `Costat ${labelOf(COSTATS_LESIO, injury.costat).toLowerCase()}`].filter((x) => x && x !== "—").join(" · ")}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Stat label="Data lesió" value={<span className="text-base">{formatDate(injury.data_lesio, { day: "numeric", month: "short" })}</span>} sub={injury.data_cirurgia ? `IQ ${formatDate(injury.data_cirurgia, { day: "numeric", month: "short" })}` : "Sense IQ"} />
              <Stat label="Setmana" value={week!.setmana} sub={`${week!.dies} dies`} />
              <Stat label="Sessions fetes" value={sessionsFetes.length} />
              <Stat
                label="Alta prevista"
                value={<span className="text-base">{injury.data_prevista ? formatDate(injury.data_prevista, { day: "numeric", month: "short" }) : "—"}</span>}
                sub={rtpCompteEnrere(rtp?.diesRestants ?? null) ?? "Sense data"}
              />
            </div>
            <div className="mt-4">
              <RtpTimeline fase={injury.fase ?? 1} />
            </div>
          </>
        ) : (
          <Empty>Sense lesió activa.</Empty>
        )}
      </Card>

      <div className="print-row grid gap-4 sm:grid-cols-2 print:break-before-page">
        <Card title="Estat actual" className="print-avoid">
          <div className="grid grid-cols-2 gap-2">
            <Stat label={avui?.data === today ? "Wellness d'avui" : "Últim wellness"} value={avui ? `${wellnessScore(avui)}/25` : "—"} sub={avui ? <SemaforBadge status={wellnessStatus(avui)} /> : "Sense registre"} />
            <Stat label="Dolor (EVA)" value={avui ? `${avui.dolor_eva}/10` : "—"} sub={avui ? formatDate(avui.data, { day: "numeric", month: "short" }) : undefined} />
            <Stat label="Fatiga (ACWR)" value={fatiga.acwr == null ? "—" : fatiga.acwr.toFixed(2).replace(".", ",")} sub={<AcwrBadge zona={fatiga.zona} />} />
            <Stat label="Càrrega 7 dies" value={Math.round(fatiga.aguda)} sub="UA (sRPE)" />
          </div>
        </Card>
        <Card title="Mapa de dolor · 14 dies" className="print-avoid">
          {dolor.length ? <BodyMap zones={dolor} /> : <Empty>Sense zones de dolor.</Empty>}
        </Card>
      </div>

      <Card title="Tests: actual vs baseline" className="print-avoid">
        {resumTests.length === 0 ? (
          <Empty>Cap test registrat.</Empty>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted">
              <tr>
                <th className="py-1.5 pr-2 font-medium">Test</th>
                <th className="py-1.5 pr-2 font-medium">Costat</th>
                <th className="py-1.5 pr-2 text-right font-medium">Baseline</th>
                <th className="py-1.5 pr-2 text-right font-medium">Actual</th>
                <th className="py-1.5 pr-2 text-right font-medium">Canvi</th>
                <th className="py-1.5 text-right font-medium">LSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border tabular-nums">
              {resumTests.flatMap((t) =>
                t.costats.map((c, i) => (
                  <tr key={`${t.nom}-${c.costat}`}>
                    <td className="py-1.5 pr-2 font-medium">{i === 0 ? t.nom : ""}</td>
                    <td className="py-1.5 pr-2 text-muted">{labelOf(COSTATS_TEST, c.costat).replace(" / no aplica", "")}</td>
                    <td className="py-1.5 pr-2 text-right">
                      {c.baseline} {t.unitat}
                    </td>
                    <td className="py-1.5 pr-2 text-right">
                      {c.actual} {t.unitat}
                    </td>
                    <td className="py-1.5 pr-2 text-right">{formatPct(c.pct, 1)}</td>
                    <td className="py-1.5 text-right">{i === 0 && t.lsi != null ? `${t.lsi.toFixed(0)}%` : ""}</td>
                  </tr>
                )),
              )}
            </tbody>
          </table>
        )}
      </Card>

      <div className="print-row grid gap-4 sm:grid-cols-2">
        <Card title="Últims tractaments" className="print-avoid">
          {tractaments.length === 0 ? (
            <Empty>Cap tractament.</Empty>
          ) : (
            <ul className="space-y-2 text-sm">
              {tractaments.map((t) => (
                <li key={t.id}>
                  <span className="font-medium">{formatDate(t.data, { day: "numeric", month: "short" })}</span>{" "}
                  <span className="text-muted">· {t.tecniques.map((x) => labelOf(TECNIQUES, x)).join(", ") || "—"}</span>
                  {t.dolor_abans != null && t.dolor_despres != null && <span className="text-muted"> · Dolor {t.dolor_abans}→{t.dolor_despres}</span>}
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card title="Últimes sessions" className="print-avoid">
          {sessionsFetes.length === 0 ? (
            <Empty>Cap sessió feta.</Empty>
          ) : (
            <ul className="space-y-2 text-sm">
              {sessionsFetes.slice(0, 5).map((s) => (
                <li key={s.id}>
                  <span className="font-medium">{formatDate(s.data, { day: "numeric", month: "short" })}</span> <span className="text-muted">· {s.nom || "Sessió"}</span>
                  {sessionLoad(s) > 0 && <span className="text-muted"> · RPE {s.rpe} × {s.durada_min}′ = {sessionLoad(s)} UA</span>}
                  {s.field_work?.distancia_m ? <span className="text-muted"> · {(s.field_work.distancia_m / 1000).toFixed(1)} km</span> : null}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <p className="pb-4 text-center text-xs text-muted">Document intern del CE Europa · Dades confidencials de salut</p>
    </div>
  );
}
