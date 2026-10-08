import { describe, expect, it } from "vitest";
import {
  acwrZone,
  fatigueMetrics,
  fatigueSeries,
  wellnessTrend,
  baselineOf,
  daysBetween,
  loadProgression,
  lsi,
  mondayOf,
  pctVsBaseline,
  summarizeTests,
  todayISO,
  treatmentWeek,
  videoEmbedUrl,
  weeklyLoads,
  wellnessScore,
  wellnessStatus,
} from "./calc";

const w = (o: Partial<Parameters<typeof wellnessStatus>[0] & object> = {}) => ({
  son_qualitat: 4, fatiga: 4, estres: 4, estat_anim: 4, recuperacio: 4, dolor_eva: 0, ...o,
});

describe("dates", () => {
  it("todayISO usa la zona horària de Madrid", () => {
    // 23:30 UTC del 31/12 ja és 1/1 a Madrid
    expect(todayISO(new Date("2026-12-31T23:30:00Z"))).toBe("2027-01-01");
  });
  it("mondayOf", () => {
    expect(mondayOf("2026-10-07")).toBe("2026-10-05"); // dimecres
    expect(mondayOf("2026-10-11")).toBe("2026-10-05"); // diumenge
    expect(mondayOf("2026-10-05")).toBe("2026-10-05");
  });
  it("daysBetween travessa el canvi d'hora", () => {
    expect(daysBetween("2026-10-20", "2026-10-27")).toBe(7);
  });
});

describe("treatmentWeek", () => {
  it("compta des de la lesió; dia 0 = setmana 1", () => {
    expect(treatmentWeek({ data_lesio: "2026-10-01", data_cirurgia: null }, "2026-10-01")).toEqual({ setmana: 1, dies: 0, referencia: "lesio" });
    expect(treatmentWeek({ data_lesio: "2026-10-01", data_cirurgia: null }, "2026-10-08").setmana).toBe(2);
  });
  it("prioritza la data de cirurgia", () => {
    const r = treatmentWeek({ data_lesio: "2026-08-01", data_cirurgia: "2026-08-15" }, "2026-08-29");
    expect(r).toEqual({ setmana: 3, dies: 14, referencia: "cirurgia" });
  });
  it("s'atura a la data d'alta", () => {
    expect(treatmentWeek({ data_lesio: "2026-01-01", data_cirurgia: null, data_alta: "2026-01-15" }, "2026-06-01").dies).toBe(14);
  });
});

describe("wellness", () => {
  it("puntuació 5–25", () => {
    expect(wellnessScore(w())).toBe(20);
  });
  it("semàfor", () => {
    expect(wellnessStatus(null)).toBe("sense");
    expect(wellnessStatus(w())).toBe("verd");
    expect(wellnessStatus(w({ dolor_eva: 3 }))).toBe("groc");
    expect(wellnessStatus(w({ fatiga: 2 }))).toBe("groc");
    expect(wellnessStatus(w({ dolor_eva: 6 }))).toBe("vermell");
    expect(wellnessStatus(w({ estres: 1 }))).toBe("vermell");
    expect(wellnessStatus(w({ son_qualitat: 3, fatiga: 3, estres: 3, estat_anim: 3, recuperacio: 3 }))).toBe("groc");
  });
});

describe("càrrega", () => {
  const sessions = [
    { data: "2026-09-28", completada: true, rpe: 5, durada_min: 60, field_work: { minuts_carrera: 10, distancia_m: 1500, esprints: 0 } },
    { data: "2026-09-30", completada: true, rpe: 6, durada_min: 50, field_work: null },
    { data: "2026-10-05", completada: true, rpe: 7, durada_min: 60, field_work: { minuts_carrera: 20, distancia_m: 3000, esprints: 4 } },
    { data: "2026-10-06", completada: false, rpe: 8, durada_min: 90 },
  ];
  it("agrega per setmana i ignora les no completades", () => {
    const weeks = weeklyLoads(sessions);
    expect(weeks).toHaveLength(2);
    expect(weeks[0]).toMatchObject({ setmana: "2026-09-28", sessions: 2, srpe: 600, distanciaM: 1500 });
    expect(weeks[1]).toMatchObject({ setmana: "2026-10-05", sessions: 1, srpe: 420, distanciaM: 3000, esprints: 4 });
  });
  it("progressió respecte a la setmana anterior", () => {
    const p = loadProgression(weeklyLoads(sessions), "2026-10-07");
    expect(p.srpe).toBe(420);
    expect(p.srpeAnterior).toBe(600);
    expect(p.srpeCanvi).toBeCloseTo(-30);
    expect(p.distanciaCanvi).toBeCloseTo(100);
  });
});

describe("tests físics", () => {
  it("% vs baseline respecta la direcció", () => {
    expect(pctVsBaseline(30, 40)).toBeCloseTo(-25);
    expect(pctVsBaseline(2.2, 2.0, "menys")).toBeCloseTo(-10); // més temps = pitjor
  });
  it("LSI", () => {
    expect(lsi(90, 100)).toBeCloseTo(90);
    expect(lsi(2.5, 2.0, "menys")).toBeCloseTo(80);
    expect(lsi(10, 0)).toBeNull();
  });
  const base = { tipus: "hop" as const, unitat: "cm", millor_si: "mes" as const };
  const rows = [
    { ...base, nom: "Single hop", costat: "lesionat" as const, valor: 150, data: "2026-01-10", es_baseline: true },
    { ...base, nom: "Single hop", costat: "sa" as const, valor: 155, data: "2026-01-10", es_baseline: true },
    { ...base, nom: "Single hop", costat: "lesionat" as const, valor: 120, data: "2026-09-01", es_baseline: false },
    { ...base, nom: "Single hop", costat: "sa" as const, valor: 150, data: "2026-09-01", es_baseline: false },
    { ...base, nom: "Single hop", costat: "lesionat" as const, valor: 135, data: "2026-10-01", es_baseline: false },
  ];
  it("baseline: el marcat, o el primer valor", () => {
    expect(baselineOf(rows.filter((r) => r.costat === "lesionat"))?.valor).toBe(150);
    expect(baselineOf(rows.slice(2, 3).concat(rows.slice(4)))?.valor).toBe(120);
  });
  it("resum per costat i darrer LSI amb tots dos costats", () => {
    const [s] = summarizeTests(rows);
    const les = s.costats.find((c) => c.costat === "lesionat")!;
    expect(les).toMatchObject({ baseline: 150, actual: 135, mesures: 3 });
    expect(les.pct).toBeCloseTo(-10);
    expect(s.lsi).toBeCloseTo(80);
    expect(s.lsiData).toBe("2026-09-01");
  });
});

describe("vídeos", () => {
  it("converteix enllaços de YouTube i Vimeo", () => {
    expect(videoEmbedUrl("https://www.youtube.com/watch?v=abc123")).toBe("https://www.youtube-nocookie.com/embed/abc123");
    expect(videoEmbedUrl("https://youtu.be/abc123")).toBe("https://www.youtube-nocookie.com/embed/abc123");
    expect(videoEmbedUrl("https://youtube.com/shorts/xyz")).toBe("https://www.youtube-nocookie.com/embed/xyz");
    expect(videoEmbedUrl("https://vimeo.com/12345")).toBe("https://player.vimeo.com/video/12345");
    expect(videoEmbedUrl("https://example.com/video.mp4")).toBeNull();
    expect(videoEmbedUrl("no és url")).toBeNull();
  });
});

describe("fatiga acumulada", () => {
  const ses = (data: string, rpe: number, min: number, completada = true) => ({ data, rpe, durada_min: min, completada });
  // 4 setmanes estables de 3 sessions de 300 UA (900/setmana)
  const base = ["2026-09-08", "2026-09-10", "2026-09-12", "2026-09-15", "2026-09-17", "2026-09-19", "2026-09-22", "2026-09-24", "2026-09-26", "2026-09-29", "2026-10-01", "2026-10-03"].map((d) => ses(d, 5, 60));

  it("ACWR ~1 amb càrrega estable i zona òptima", () => {
    const f = fatigueMetrics(base, "2026-10-05");
    expect(f.aguda).toBe(900);
    expect(f.cronica).toBe(900);
    expect(f.acwr).toBeCloseTo(1);
    expect(f.zona).toBe("optima");
    expect(f.fiable).toBe(true);
  });
  it("pic de càrrega → risc", () => {
    const pic = [...base, ses("2026-10-04", 9, 90), ses("2026-10-05", 9, 90)];
    const f = fatigueMetrics(pic, "2026-10-05");
    expect(f.aguda).toBe(900 + 1620);
    expect(f.zona).toBe("risc");
  });
  it("ignora sessions no completades i marca poc fiable amb poc historial", () => {
    const f = fatigueMetrics([ses("2026-10-01", 6, 60), ses("2026-10-02", 8, 60, false)], "2026-10-05");
    expect(f.aguda).toBe(360);
    expect(f.fiable).toBe(false);
  });
  it("monotonia i strain", () => {
    // 7 dies: 300,0,300,0,300,0,0 → mitjana 128.6, sd 147.5 → monotonia 0.87
    const f = fatigueMetrics(base, "2026-10-05");
    expect(f.monotonia).toBeCloseTo(0.87, 2);
    expect(f.strain).toBeCloseTo(900 * f.monotonia!, 5);
    expect(fatigueMetrics([], "2026-10-05").monotonia).toBeNull();
  });
  it("zones ACWR", () => {
    expect(acwrZone(null)).toBe("sense");
    expect(acwrZone(0.5)).toBe("baixa");
    expect(acwrZone(1.2)).toBe("optima");
    expect(acwrZone(1.4)).toBe("precaucio");
    expect(acwrZone(1.6)).toBe("risc");
  });
  it("sèrie diària coherent amb les mètriques", () => {
    const serie = fatigueSeries(base, "2026-10-05", 14);
    expect(serie).toHaveLength(14);
    expect(serie.at(-1)!.data).toBe("2026-10-05");
    expect(serie.at(-1)!.acwr).toBeCloseTo(1);
    expect(serie.find((d) => d.data === "2026-10-03")!.srpe).toBe(300);
  });
  it("tendència del wellness (7 vs 28 dies)", () => {
    const e = (data: string, v: number, dolor: number) => ({ data, son_qualitat: v, fatiga: v, estres: v, estat_anim: v, recuperacio: v, dolor_eva: dolor, son_hores: 8 });
    const entries = [e("2026-09-10", 4, 0), e("2026-09-15", 4, 0), e("2026-09-20", 4, 0), e("2026-10-02", 3, 2), e("2026-10-04", 3, 2)];
    const [punt, fatiga, son, dolor] = wellnessTrend(entries, "2026-10-05");
    expect(punt.dies7).toBe(15);
    expect(punt.canvi!).toBeLessThan(0);
    expect(fatiga.dies7).toBe(3);
    expect(son.canvi).toBe(0);
    expect(dolor.canvi!).toBeLessThan(0); // més dolor = pitjor
  });
});
