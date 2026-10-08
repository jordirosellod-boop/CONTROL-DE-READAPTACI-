import Link from "next/link";
import { LoadCharts, TestChart, WellnessCharts } from "@/components/charts";
import { ActionButton } from "@/components/forms";
import { Badge, Card, Empty, LinkButton, PageHeader, SemaforBadge, Stat, cx } from "@/components/ui";
import { deleteTest, deleteWellness } from "@/lib/actions";
import { addDays, baselineOf, formatDate, formatPct, loadProgression, sessionLoad, summarizeTests, todayISO, treatmentWeek, weeklyLoads, wellnessScore, wellnessStatus } from "@/lib/calc";
import { CAMES, CATEGORIES_LESIO, COSTATS_LESIO, COSTATS_TEST, POSICIONS, TECNIQUES, TIPUS_TEST, ZONES_COS, labelOf } from "@/lib/constants";
import { activeInjury, getPlayerBundle, type SessionWithField } from "@/lib/data";
import type { Injury, PhysicalTest, Treatment, WellnessEntry } from "@/lib/types";

const TABS = [
  { key: "resum", label: "Resum" },
  { key: "wellness", label: "Wellness" },
  { key: "sessions", label: "Sessions" },
  { key: "tractament", label: "Tractament" },
  { key: "tests", label: "Tests" },
  { key: "lesions", label: "Lesions" },
] as const;
type Tab = (typeof TABS)[number]["key"];

export default async function PlayerPage({ params, searchParams }: PageProps<"/jugadors/[id]">) {
  const { id } = await params;
  const { tab: rawTab } = await searchParams;
  const tab: Tab = TABS.some((t) => t.key === rawTab) ? (rawTab as Tab) : "resum";
  const { player, injuries, wellness, sessions, tests, treatments, treatmentsReady } = await getPlayerBundle(id);
  const today = todayISO();
  const injury = activeInjury(injuries);
  // Sessions i tests del procés actual (des de la lesió activa), o tot l'històric si no n'hi ha.
  const procSessions = injury ? sessions.filter((s) => s.data >= injury.data_lesio) : sessions;
  const procTests = injury ? tests.filter((t) => t.data >= injury.data_lesio || t.es_baseline) : tests;

  return (
    <>
      <PageHeader
        back={{ href: "/", label: "Panell" }}
        title={
          <span className="flex flex-wrap items-center gap-2">
            {player.nom} {player.cognoms}
            {player.arxivat && <Badge>Arxivat</Badge>}
          </span>
        }
        subtitle={[labelOf(POSICIONS, player.posicio), player.edat ? `${player.edat} anys` : null, `Cama ${labelOf(CAMES, player.cama_dominant).toLowerCase()}`].filter(Boolean).join(" · ")}
        actions={
          <>
            <LinkButton href={`/jugadors/${id}/editar`} variant="ghost">
              Editar fitxa
            </LinkButton>
            <LinkButton href={`/jugadors/${id}/wellness`} variant="secondary">
              Wellness
            </LinkButton>
            <LinkButton href={`/jugadors/${id}/tractaments/nou`} variant="secondary">
              + Tractament
            </LinkButton>
            <LinkButton href={`/jugadors/${id}/sessions/nova`}>+ Sessió</LinkButton>
          </>
        }
      />

      <nav className="-mx-4 mb-5 overflow-x-auto px-4" aria-label="Seccions">
        <div className="flex w-max gap-1 rounded-full border-2 border-accent/20 p-1">
          {TABS.map((t) => (
            <Link
              key={t.key}
              href={`/jugadors/${id}?tab=${t.key}`}
              aria-current={tab === t.key ? "page" : undefined}
              className={cx("display rounded-full px-4 py-2 text-[15px]", tab === t.key ? "bg-accent text-accent-fg" : "text-accent hover:bg-accent-soft")}
            >
              {t.label}
            </Link>
          ))}
        </div>
      </nav>

      {tab === "resum" && <Resum playerId={id} injury={injury} wellness={wellness} sessions={procSessions} tests={procTests} today={today} />}
      {tab === "wellness" && <WellnessTab playerId={id} wellness={wellness} />}
      {tab === "sessions" && <SessionsTab playerId={id} sessions={sessions} today={today} />}
      {tab === "tractament" && <TractamentTab playerId={id} treatments={treatments} ready={treatmentsReady} injury={injury} />}
      {tab === "tests" && <TestsTab playerId={id} tests={procTests} allTests={tests} />}
      {tab === "lesions" && <LesionsTab playerId={id} injuries={injuries} historial={player.historial_lesions} sessions={sessions} today={today} />}
    </>
  );
}

// ---------------------------------------------------------------------------

function Resum({ playerId, injury, wellness, sessions, tests, today }: { playerId: string; injury: Injury | null; wellness: WellnessEntry[]; sessions: SessionWithField[]; tests: PhysicalTest[]; today: string }) {
  const avui = wellness.find((w) => w.data === today) ?? null;
  const week = injury ? treatmentWeek(injury, today) : null;
  const weeks = weeklyLoads(sessions);
  const progress = loadProgression(weeks, today);
  const summary = summarizeTests(tests);
  const last30 = wellness.filter((w) => w.data > addDays(today, -30)).slice().reverse();

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Lesió activa" actions={injury && <LinkButton href={`/jugadors/${playerId}/lesions/${injury.id}`} variant="ghost" size="sm">Editar</LinkButton>}>
          {injury ? (
            <>
              <p className="display text-2xl text-heading">{injury.diagnostic}</p>
              <p className="text-sm text-muted">
                {[labelOf(CATEGORIES_LESIO, injury.categoria), injury.zona, injury.costat && `Costat ${labelOf(COSTATS_LESIO, injury.costat).toLowerCase()}`].filter((x) => x && x !== "—").join(" · ")}
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Stat label="Setmana" value={week!.setmana} sub={week!.referencia === "cirurgia" ? "des de la IQ" : "des de la lesió"} />
                <Stat label="Dies" value={week!.dies} />
                <Stat label="Sessions fetes" value={sessions.filter((s) => s.completada).length} />
                <Stat label="Data lesió" value={<span className="text-base">{formatDate(injury.data_lesio, { day: "numeric", month: "short" })}</span>} sub={injury.data_cirurgia ? `IQ: ${formatDate(injury.data_cirurgia, { day: "numeric", month: "short" })}` : "Sense IQ"} />
              </div>
            </>
          ) : (
            <Empty>
              Cap lesió activa. <Link className="font-medium text-accent underline" href={`/jugadors/${playerId}/lesions/nova`}>Registrar lesió</Link>
            </Empty>
          )}
        </Card>

        <Card title="Wellness d'avui" actions={<LinkButton href={`/jugadors/${playerId}/wellness`} variant={avui ? "ghost" : "primary"} size="sm">{avui ? "Editar" : "Registrar"}</LinkButton>}>
          {avui ? <WellnessDetail w={avui} /> : <Empty>Encara no s&apos;ha registrat el wellness d&apos;avui.</Empty>}
        </Card>
      </div>

      <Card title="Evolució del wellness (30 dies)">
        {last30.length ? <WellnessCharts data={last30.map((w) => ({ data: w.data, puntuacio: wellnessScore(w), dolor: w.dolor_eva, son_hores: w.son_hores }))} /> : <Empty>Sense registres.</Empty>}
      </Card>

      <Card title="Progressió de càrrega">
        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat label="sRPE aquesta setmana" value={`${Math.round(progress.srpe)} UA`} sub={`${formatPct(progress.srpeCanvi)} vs anterior (${Math.round(progress.srpeAnterior)})`} />
          <Stat label="Distància aquesta setmana" value={`${(progress.distancia / 1000).toFixed(1)} km`} sub={`${formatPct(progress.distanciaCanvi)} vs anterior`} />
        </div>
        {weeks.length ? <LoadCharts weeks={weeks.slice(-12).map((w) => ({ setmana: w.setmana, srpe: w.srpe, distanciaKm: Math.round(w.distanciaM / 100) / 10 }))} /> : <Empty>Cap sessió completada.</Empty>}
      </Card>

      <Card title="Tests: actual vs baseline" actions={<LinkButton href={`/jugadors/${playerId}?tab=tests`} variant="ghost" size="sm">Veure tots</LinkButton>}>
        <TestSummaryTable summary={summary} />
      </Card>
    </div>
  );
}

function WellnessDetail({ w }: { w: WellnessEntry }) {
  const items = [
    ["Son", `${w.son_qualitat}/5${w.son_hores != null ? ` · ${w.son_hores} h` : ""}`],
    ["Fatiga", `${w.fatiga}/5`],
    ["Estrès", `${w.estres}/5`],
    ["Ànim", `${w.estat_anim}/5`],
    ["Recuperació", `${w.recuperacio}/5`],
    ["Dolor (EVA)", `${w.dolor_eva}/10`],
  ];
  return (
    <div>
      <div className="mb-3 flex items-center gap-3">
        <span className="display text-4xl text-heading tabular-nums">{wellnessScore(w)}</span>
        <span className="text-sm text-muted">/ 25</span>
        <SemaforBadge status={wellnessStatus(w)} />
      </div>
      <dl className="grid grid-cols-3 gap-2 text-sm">
        {items.map(([k, v]) => (
          <div key={k} className="rounded-lg bg-surface-2 px-2 py-1.5">
            <dt className="text-xs text-muted">{k}</dt>
            <dd className="font-medium tabular-nums">{v}</dd>
          </div>
        ))}
      </dl>
      {w.dolor_zones.length > 0 && <p className="mt-2 text-sm"><span className="text-muted">Zones: </span>{w.dolor_zones.map((z) => labelOf(ZONES_COS, z)).join(", ")}</p>}
      {w.comentari && <p className="mt-1 text-sm text-muted">“{w.comentari}”</p>}
    </div>
  );
}

function TestSummaryTable({ summary }: { summary: ReturnType<typeof summarizeTests> }) {
  if (!summary.length) return <Empty>Cap test registrat.</Empty>;
  return (
    <div className="-mx-4 overflow-x-auto px-4">
      <table className="w-full min-w-[560px] text-sm">
        <thead className="text-left text-xs text-muted">
          <tr>
            <th className="py-2 pr-2 font-medium">Test</th>
            <th className="py-2 pr-2 font-medium">Costat</th>
            <th className="py-2 pr-2 text-right font-medium">Baseline</th>
            <th className="py-2 pr-2 text-right font-medium">Actual</th>
            <th className="py-2 pr-2 text-right font-medium">vs baseline</th>
            <th className="py-2 text-right font-medium">LSI</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {summary.flatMap((t) =>
            t.costats.map((c, i) => (
              <tr key={`${t.nom}-${c.costat}`}>
                <td className="py-2 pr-2 font-medium">{i === 0 ? t.nom : ""}</td>
                <td className="py-2 pr-2 text-muted">{labelOf(COSTATS_TEST, c.costat).replace(" / no aplica", "")}</td>
                <td className="py-2 pr-2 text-right tabular-nums">{fmt(c.baseline)} {t.unitat}</td>
                <td className="py-2 pr-2 text-right tabular-nums">{fmt(c.actual)} {t.unitat}</td>
                <td className={cx("py-2 pr-2 text-right font-medium tabular-nums", c.pct != null && (c.pct < -10 ? "text-danger" : c.pct >= 0 ? "text-ok" : "text-warn"))}>{formatPct(c.pct, 1)}</td>
                <td className={cx("py-2 text-right tabular-nums", i === 0 && t.lsi != null && (t.lsi >= 90 ? "text-ok" : t.lsi >= 80 ? "text-warn" : "text-danger"))}>{i === 0 && t.lsi != null ? `${t.lsi.toFixed(0)}%` : ""}</td>
              </tr>
            )),
          )}
        </tbody>
      </table>
      <p className="mt-2 text-xs text-muted">% positiu = millora respecte al baseline (ja té en compte si el test és de temps). LSI = costat lesionat / costat sa; objectiu habitual ≥ 90%.</p>
    </div>
  );
}

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/0$/, ""));

// ---------------------------------------------------------------------------

function WellnessTab({ playerId, wellness }: { playerId: string; wellness: WellnessEntry[] }) {
  const chron = wellness.slice(0, 60).reverse();
  return (
    <div className="space-y-4">
      <Card title="Evolució" actions={<LinkButton href={`/jugadors/${playerId}/wellness`} size="sm">+ Registrar</LinkButton>}>
        {chron.length ? <WellnessCharts data={chron.map((w) => ({ data: w.data, puntuacio: wellnessScore(w), dolor: w.dolor_eva, son_hores: w.son_hores }))} /> : <Empty>Sense registres.</Empty>}
      </Card>
      <Card title="Registres">
        {wellness.length === 0 ? (
          <Empty>Sense registres.</Empty>
        ) : (
          <div className="-mx-4 overflow-x-auto px-4">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="text-left text-xs text-muted">
                <tr>
                  {["Data", "Estat", "Total", "Son", "Hores", "Fatiga", "Estrès", "Ànim", "Recup.", "Dolor", "Zones", ""].map((h) => (
                    <th key={h} className="py-2 pr-2 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border tabular-nums">
                {wellness.map((w) => (
                  <tr key={w.id}>
                    <td className="py-2 pr-2 whitespace-nowrap">
                      <Link className="underline-offset-2 hover:underline" href={`/jugadors/${playerId}/wellness?data=${w.data}`}>{formatDate(w.data, { day: "numeric", month: "short" })}</Link>
                    </td>
                    <td className="py-2 pr-2"><SemaforBadge status={wellnessStatus(w)} /></td>
                    <td className="py-2 pr-2 font-medium">{wellnessScore(w)}</td>
                    <td className="py-2 pr-2">{w.son_qualitat}</td>
                    <td className="py-2 pr-2">{w.son_hores ?? "—"}</td>
                    <td className="py-2 pr-2">{w.fatiga}</td>
                    <td className="py-2 pr-2">{w.estres}</td>
                    <td className="py-2 pr-2">{w.estat_anim}</td>
                    <td className="py-2 pr-2">{w.recuperacio}</td>
                    <td className="py-2 pr-2">{w.dolor_eva}</td>
                    <td className="py-2 pr-2 text-xs text-muted">{w.dolor_zones.map((z) => labelOf(ZONES_COS, z)).join(", ")}</td>
                    <td className="py-2 text-right"><ActionButton action={deleteWellness.bind(null, playerId, w.id)} variant="ghost" confirm="Eliminar aquest registre?">✕</ActionButton></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------

function SessionsTab({ playerId, sessions, today }: { playerId: string; sessions: SessionWithField[]; today: string }) {
  return (
    <Card title="Sessions de readaptació" actions={<LinkButton href={`/jugadors/${playerId}/sessions/nova`} size="sm">+ Nova sessió</LinkButton>}>
      {sessions.length === 0 ? (
        <Empty>Encara no hi ha sessions.</Empty>
      ) : (
        <ul className="divide-y divide-border">
          {sessions.map((s) => (
            <li key={s.id}>
              <Link href={`/jugadors/${playerId}/sessions/${s.id}`} className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-3 hover:bg-surface-2">
                <div className="w-14 shrink-0 text-center">
                  <div className="text-xs text-muted">{formatDate(s.data, { month: "short" })}</div>
                  <div className="text-lg font-semibold tabular-nums">{Number(s.data.slice(8))}</div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{s.nom || "Sessió"}</div>
                  <div className="text-sm text-muted">
                    {[s.rpe != null && `RPE ${s.rpe}`, s.durada_min != null && `${s.durada_min} min`, sessionLoad(s) > 0 && `${sessionLoad(s)} UA`, s.field_work?.distancia_m && `${(s.field_work.distancia_m / 1000).toFixed(1)} km`].filter(Boolean).join(" · ") || "Sense dades de càrrega"}
                  </div>
                </div>
                {s.completada ? <Badge tone="ok">✓ Feta</Badge> : s.data === today ? <Badge tone="accent">Avui</Badge> : s.data > today ? <Badge>Planificada</Badge> : <Badge tone="warn">Pendent</Badge>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------

function TestsTab({ playerId, tests, allTests }: { playerId: string; tests: PhysicalTest[]; allTests: PhysicalTest[] }) {
  const summary = summarizeTests(tests);
  const byName = [...new Set(tests.map((t) => t.nom))].sort((a, b) => a.localeCompare(b, "ca"));
  return (
    <div className="space-y-4">
      <Card title="Resum: actual vs baseline" actions={<LinkButton href={`/jugadors/${playerId}/tests/nou`} size="sm">+ Nou test</LinkButton>}>
        <TestSummaryTable summary={summary} />
      </Card>
      {byName.length > 0 && (
        <Card title="Evolució per test">
          <div className="grid gap-6 md:grid-cols-2">
            {byName.map((nom) => {
              const rows = tests.filter((t) => t.nom === nom);
              const baselines = (["lesionat", "sa", "bilateral"] as const).flatMap((c) => {
                const b = baselineOf(rows.filter((r) => r.costat === c));
                return b ? [{ costat: c, valor: Number(b.valor) }] : [];
              });
              return <TestChart key={nom} title={nom} unit={rows.at(-1)?.unitat ?? null} rows={rows.map((r) => ({ data: r.data, costat: r.costat, valor: Number(r.valor) }))} baselines={baselines} />;
            })}
          </div>
          <p className="mt-3 text-xs text-muted">Línia discontínua = baseline de cada costat.</p>
        </Card>
      )}
      <Card title="Tots els registres">
        {allTests.length === 0 ? (
          <Empty>Cap test registrat.</Empty>
        ) : (
          <div className="-mx-4 overflow-x-auto px-4">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="text-left text-xs text-muted">
                <tr>
                  {["Data", "Tipus", "Test", "Costat", "Valor", ""].map((h) => (
                    <th key={h} className="py-2 pr-2 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[...allTests].reverse().map((t) => (
                  <tr key={t.id}>
                    <td className="py-2 pr-2 whitespace-nowrap">{formatDate(t.data, { day: "numeric", month: "short", year: "2-digit" })}</td>
                    <td className="py-2 pr-2 text-muted">{labelOf(TIPUS_TEST, t.tipus)}</td>
                    <td className="py-2 pr-2 font-medium">
                      {t.nom} {t.es_baseline && <Badge tone="accent">Baseline</Badge>}
                    </td>
                    <td className="py-2 pr-2 text-muted">{labelOf(COSTATS_TEST, t.costat).replace(" / no aplica", "")}</td>
                    <td className="py-2 pr-2 tabular-nums">{fmt(Number(t.valor))} {t.unitat}</td>
                    <td className="py-2 text-right"><ActionButton action={deleteTest.bind(null, playerId, t.id)} variant="ghost" confirm="Eliminar aquest registre?">✕</ActionButton></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------

function LesionsTab({ playerId, injuries, historial, sessions, today }: { playerId: string; injuries: Injury[]; historial: string | null; sessions: SessionWithField[]; today: string }) {
  return (
    <div className="space-y-4">
      <Card title="Lesions registrades" actions={<LinkButton href={`/jugadors/${playerId}/lesions/nova`} size="sm">+ Nova lesió</LinkButton>}>
        {injuries.length === 0 ? (
          <Empty>Cap lesió registrada.</Empty>
        ) : (
          <ul className="divide-y divide-border">
            {injuries.map((i) => {
              const w = treatmentWeek(i, today);
              const fetes = sessions.filter((s) => s.completada && s.data >= i.data_lesio && (!i.data_alta || s.data <= i.data_alta)).length;
              return (
                <li key={i.id}>
                  <Link href={`/jugadors/${playerId}/lesions/${i.id}`} className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-3 hover:bg-surface-2">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium">{i.diagnostic}</div>
                      <div className="text-sm text-muted">
                        {formatDate(i.data_lesio)}
                        {i.data_cirurgia && ` · IQ ${formatDate(i.data_cirurgia)}`}
                        {i.data_alta ? ` → alta ${formatDate(i.data_alta)}` : ""} · {w.dies} dies · {fetes} sessions
                      </div>
                    </div>
                    {i.activa ? <Badge tone="warn">Activa · S{w.setmana}</Badge> : <Badge tone="ok">Alta</Badge>}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
      <Card title="Historial previ" actions={<LinkButton href={`/jugadors/${playerId}/editar`} variant="ghost" size="sm">Editar</LinkButton>}>
        {historial ? <p className="whitespace-pre-wrap text-sm">{historial}</p> : <Empty>Sense historial previ.</Empty>}
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------

function TractamentTab({ playerId, treatments, ready, injury }: { playerId: string; treatments: Treatment[]; ready: boolean; injury: Injury | null }) {
  if (!ready) {
    return (
      <Card title="Tractament a camilla">
        <Empty>Falta crear la taula de tractaments a Supabase. Executa el SQL de tractaments al SQL Editor i torna a carregar la pàgina.</Empty>
      </Card>
    );
  }
  const delProces = injury ? treatments.filter((t) => t.data >= injury.data_lesio) : treatments;
  const minuts = delProces.reduce((acc, t) => acc + (t.durada_min ?? 0), 0);
  const ambDolor = delProces.filter((t) => t.dolor_abans != null && t.dolor_despres != null);
  const millora = ambDolor.length ? ambDolor.reduce((acc, t) => acc + (t.dolor_abans! - t.dolor_despres!), 0) / ambDolor.length : null;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <Stat label={injury ? "Tractaments (lesió actual)" : "Tractaments"} value={delProces.length} />
        <Stat label="Minuts a camilla" value={minuts} />
        <Stat
          label="Canvi de dolor"
          value={millora == null ? "—" : millora === 0 ? "=" : `${millora > 0 ? "↓" : "↑"} ${Math.abs(millora).toFixed(1)}`}
          sub="mitjana EVA abans → després"
        />
      </div>
      <Card title="Historial" actions={<LinkButton href={`/jugadors/${playerId}/tractaments/nou`} size="sm">+ Nou</LinkButton>}>
        {treatments.length === 0 ? (
          <Empty>Encara no hi ha cap tractament registrat.</Empty>
        ) : (
          <ul className="divide-y divide-border">
            {treatments.map((t) => (
              <li key={t.id}>
                <Link href={`/jugadors/${playerId}/tractaments/${t.id}`} className="-mx-2 flex gap-3 rounded-lg px-2 py-3 hover:bg-surface-2">
                  <div className="w-14 shrink-0 text-center">
                    <div className="text-xs text-muted">{formatDate(t.data, { month: "short" })}</div>
                    <div className="display text-2xl text-heading tabular-nums">{Number(t.data.slice(8))}</div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap gap-1">
                      {t.tecniques.length ? t.tecniques.map((x) => <Badge key={x} tone="accent">{labelOf(TECNIQUES, x)}</Badge>) : <span className="text-sm text-muted">Sense tècniques marcades</span>}
                    </div>
                    <div className="mt-1 text-sm text-muted">
                      {[t.zones.map((z) => labelOf(ZONES_COS, z)).join(", "), t.durada_min != null && `${t.durada_min} min`, t.dolor_abans != null && t.dolor_despres != null && `Dolor ${t.dolor_abans} → ${t.dolor_despres}`].filter(Boolean).join(" · ")}
                    </div>
                    {t.notes && <p className="mt-1 line-clamp-2 text-sm">{t.notes}</p>}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
