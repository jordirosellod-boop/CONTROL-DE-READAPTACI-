import { describe, expect, it } from "vitest";
import { PLANTILLA, buscaAPlantilla, normalitza } from "./plantilla";

describe("plantilla", () => {
  it("separa nom i cognoms i construeix la URL de la foto", () => {
    const j = PLANTILLA.find((p) => p.nom === "Khalid" && p.equip === "Primer equip masculí")!;
    expect(j).toMatchObject({ cognoms: "Noureddine", dorsal: 9, posicio: "davanter" });
    expect(j.foto).toBe("https://www.ceeuropa.cat/wp-content/uploads/2026/09/Khalidweb-768x1024.jpg");
  });
  it("normalitza accents, majúscules i cometes", () => {
    expect(normalitza("  JÚLIA  Serrat ")).toBe("julia serrat");
    expect(normalitza("Albert Tolosa 'Tito'")).toBe("albert tolosa tito");
  });
  it("troba jugadors escrits a mà, sense accents o en majúscules", () => {
    expect(buscaAPlantilla("julia", "SERRAT")?.dorsal).toBe(3);
    expect(buscaAPlantilla("Alex", "Cano")?.foto).toContain("AlexCanoweb");
    expect(buscaAPlantilla("Albert", "Tito")?.dorsal).toBe(23);
    expect(buscaAPlantilla("Marc", "Angles")?.equip).toBe("Primer equip masculí"); // prioritza el que té foto
  });
  it("no s'inventa coincidències", () => {
    expect(buscaAPlantilla("Pau", "Martí")).toBeNull();
    expect(buscaAPlantilla("Marc", "")).toBeNull();
    expect(buscaAPlantilla("Joan", "Garcia")).toBeNull();
  });
});
