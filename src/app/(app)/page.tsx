import type { Metadata } from "next";
import Link from "next/link";
import { addDays, fatigueMetrics, formatDate, formatPct, loadProgression, summarizeTests, todayISO, treatmentWeek, weeklyLoads, wellnessScore, wellnessStatus } from "@/lib/calc";
import { POSICIONS, labelOf } from "@/lib/constants";
import { activeInjury, getDashboard } from "@/lib/data";
import { AcwrBadge, Badge, Card, Empty, LinkButton, PageHeader, SemaforBadge } from "@/components/ui";

export const metadata: Metadata = { title: "Panell" };

export default async function Dashboard() {
  const today = todayISO();
  const { players, wellness, sessions, tests } = await getDashboard(today, addDays(today, -6));

  const rows = players.map((p) => {
    const injury = activeInjury(p.injuries);
    const pWellness = wellness.filter((w) => w.player_id === p.id);
    const avui = pWellness.find((w) => w.data === today) ?? null;
    const pSessions = sessions.filter((s) => s.player_id === p.id && (!injury || s.data >= injury.data_lesio));
    const progress = loadProgression(weeklyLoads(pSessions), today);
    const fatiga = fatigueMetrics(sessions.filter((s) => s.player_id === p.id), today);
    const testSummary = summarizeTests(tests.filter((t) => t.player_id === p.id && (!injury || t.data >= injury.data_lesio || t.es_baseline)));
    const lsis = testSummary.filter((t) => t.lsi != null);
    const pitjorLsi = lsis.length ? lsis.reduce((a, b) => (b.lsi! < a.lsi! ? b : a)) : null;
    return {
      player: p,
      injury,
      setmana: injury ? treatmentWeek(injury, today) : null,
      sessionsFetes: injury ? pSessions.filter((s) => s.completada).length : null,
      avui,
      status: wellnessStatus(avui),
      tendencia: pWellness.map((w) => ({ data: w.data, score: wellnessScore(w) })),
      progress,
      fatiga,
      pitjorLsi,
    };
  });

  const lesionats = rows.filter((r) => r.injury);
  const altres = rows.filter((r) => !r.injury);
  const senseWellness = lesionats.filter((r) => !r.avui);
  const alertes = lesionats.filter((r) => r.status === "vermell" || r.fatiga.zona === "risc");

  return (
    <>
      <PageHeader
        title="Panell"
        subtitle={formatDate(today, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        actions={<LinkButton href="/jugadors/nou">+ Nou jugador</LinkButton>}
      />

      {players.length === 0 ? (
        <Empty>
          Encara no hi ha cap jugador. <Link href="/jugadors/nou" className="font-medium text-accent underline">Crea el primer jugador</Link> per començar.
        </Empty>
      ) : (
        <>
          {/* Franja fosca tipus "marcador", com la de resultats de la web del club */}
          <div className="mb-6 grid grid-cols-3 divide-x divide-white/25 rounded-2xl bg-navy px-2 py-4 text-center text-white">
            <SummaryTile label="En readaptació" value={lesionats.length} />
            <SummaryTile label="Sense wellness avui" value={senseWellness.length} tone={senseWellness.length ? "warn" : undefined} />
            <SummaryTile label="Alertes" value={alertes.length} tone={alertes.length ? "danger" : undefined} />
          </div>

          {lesionats.length === 0 ? (
            <Empty>Cap jugador amb lesió activa.</Empty>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {lesionats.map((r) => (
                <Card key={r.player.id} className="flex flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link href={`/jugadors/${r.player.id}`} className="display block truncate text-2xl leading-tight text-heading hover:underline">
                        {r.player.nom} {r.player.cognoms}
                      </Link>
                      <div className="truncate text-sm text-muted">
                        {labelOf(POSICIONS, r.player.posicio)} · {r.injury!.diagnostic}
                      </div>
                    </div>
                    <SemaforBadge status={r.status} />
                  </div>

                  <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
                    <Metric label="Setmana" value={r.setmana!.setmana} sub={r.setmana!.referencia === "cirurgia" ? "post-IQ" : "post-lesió"} />
                    <Metric label="Sessions" value={r.sessionsFetes} sub="fetes" />
                    <Metric
                      label="Wellness"
                      value={r.avui ? `${wellnessScore(r.avui)}/25` : "—"}
                      sub={r.avui ? `Dolor ${r.avui.dolor_eva}/10` : "pendent"}
                    />
                  </dl>

                  <div className="mt-3 space-y-1 text-sm">
                    <div className="flex justify-between gap-2">
                      <span className="text-muted">Càrrega setmana (sRPE)</span>
                      <span className="tabular-nums">
                        {Math.round(r.progress.srpe)} UA <span className="text-muted">({formatPct(r.progress.srpeCanvi)} vs anterior)</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted">Fatiga (ACWR)</span>
                      <span className="flex items-center gap-1.5 tabular-nums">
                        {r.fatiga.acwr == null ? "—" : r.fatiga.acwr.toFixed(2).replace(".", ",")}
                        <AcwrBadge zona={r.fatiga.zona} />
                      </span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-muted">Pitjor LSI</span>
                      <span className="truncate tabular-nums">
                        {r.pitjorLsi ? (
                          <>
                            {r.pitjorLsi.lsi!.toFixed(0)}% <span className="text-muted">{r.pitjorLsi.nom}</span>
                          </>
                        ) : (
                          "—"
                        )}
                      </span>
                    </div>
                    {r.tendencia.length > 1 && (
                      <div className="flex justify-between gap-2">
                        <span className="text-muted">Wellness 7 dies</span>
                        <span className="tabular-nums">{r.tendencia.map((t) => t.score).join(" · ")}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex gap-2 pt-1">
                    <LinkButton href={`/jugadors/${r.player.id}/wellness?tornar=dashboard`} variant={r.avui ? "secondary" : "primary"} size="sm" className="flex-1">
                      {r.avui ? "Editar wellness" : "Wellness d'avui"}
                    </LinkButton>
                    <LinkButton href={`/jugadors/${r.player.id}/sessions/nova`} variant="secondary" size="sm" className="flex-1">
                      + Sessió
                    </LinkButton>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {altres.length > 0 && (
            <Card title="Altres jugadors · disponibles" className="mt-6">
              <ul className="flex flex-wrap gap-2">
                {altres.map((r) => (
                  <li key={r.player.id}>
                    <Link href={`/jugadors/${r.player.id}`} className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm hover:bg-surface-2">
                      {r.player.nom} {r.player.cognoms}
                      <Badge>{labelOf(POSICIONS, r.player.posicio)}</Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </>
      )}
    </>
  );
}

function SummaryTile({ label, value, tone }: { label: string; value: number; tone?: "warn" | "danger" }) {
  // Sobre fons fosc: groc / vermell clars per a contrast
  const toneClass = tone === "danger" ? "text-[#ff8a80]" : tone === "warn" ? "text-[#ffd166]" : "";
  return (
    <div className="px-2">
      <div className={`display text-4xl tabular-nums sm:text-5xl ${toneClass}`}>{value}</div>
      <div className="display mt-1 text-xs text-white/80 sm:text-sm">{label}</div>
    </div>
  );
}

function Metric({ label, value, sub }: { label: string; value: React.ReactNode; sub: string }) {
  return (
    <div className="rounded-xl bg-surface-2 px-2 py-2">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="display text-2xl text-heading tabular-nums">{value ?? "—"}</dd>
      <dd className="text-xs text-muted">{sub}</dd>
    </div>
  );
}
