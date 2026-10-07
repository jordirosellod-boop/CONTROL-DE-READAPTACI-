import { describe, expect, it } from "vitest";
import {
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
