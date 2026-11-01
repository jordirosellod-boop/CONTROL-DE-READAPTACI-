import { ZONES_COS, labelOf } from "@/lib/constants";
import type { ZonaDolor } from "@/lib/calc";

// Posició de cada zona sobre la silueta (caixa de 100×220). Vista de davant: la dreta del
// jugador queda a l'esquerra de qui mira; vista d'esquena: al revés.
const DAVANT: Record<string, [number, number]> = {
  cap_coll: [50, 24], espatlla_d: [30, 44], espatlla_e: [70, 44], abdomen: [50, 72], pubis: [50, 101],
  maluc_d: [37, 104], maluc_e: [63, 104], quadriceps_d: [40, 137], quadriceps_e: [60, 137],
  adductors_d: [46, 124], adductors_e: [54, 124], genoll_d: [40, 166], genoll_e: [60, 166],
  turmell_d: [40, 199], turmell_e: [60, 199], peu_d: [39, 211], peu_e: [61, 211],
};
const ESQUENA: Record<string, [number, number]> = {
  dorsal: [50, 56], lumbar: [50, 88], isquios_d: [60, 140], isquios_e: [40, 140],
  bessons_d: [60, 178], bessons_e: [40, 178], aquil_d: [60, 197], aquil_e: [40, 197],
};
// Colze/canell és una sola zona: es marca als dos braços
const BRACOS: [number, number][] = [[22, 88], [78, 88]];

function Silueta() {
  return (
    <g className="fill-surface-2 stroke-border" strokeWidth={1.5}>
      <circle cx={50} cy={17} r={12} />
      <rect x={45} y={28} width={10} height={8} rx={2} />
      <rect x={30} y={35} width={40} height={64} rx={12} />
      <rect x={32} y={92} width={36} height={20} rx={8} />
      <rect x={16} y={38} width={12} height={74} rx={6} />
      <rect x={72} y={38} width={12} height={74} rx={6} />
      <rect x={33} y={108} width={15} height={96} rx={7} />
      <rect x={52} y={108} width={15} height={96} rx={7} />
      <ellipse cx={40} cy={209} rx={9} ry={5} />
      <ellipse cx={60} cy={209} rx={9} ry={5} />
    </g>
  );
}

function Punt({ x, y, z, tone }: { x: number; y: number; z: ZonaDolor; tone: "dolor" | "tractament" }) {
  const intensitat = tone === "dolor" ? 0.3 + 0.7 * (z.maxEva / 10) : 0.85;
  const color = tone === "dolor" ? "var(--danger)" : "var(--accent)";
  return (
    <g>
      <circle cx={x} cy={y} r={9} fill={color} opacity={intensitat * 0.25} />
      <circle cx={x} cy={y} r={5.5} fill={color} opacity={intensitat} stroke="var(--surface)" strokeWidth={1.5}>
        <title>{`${labelOf(ZONES_COS, z.zona)} · ${z.dies} ${z.dies === 1 ? "dia" : "dies"}${tone === "dolor" ? ` · EVA màx. ${z.maxEva}` : ""}`}</title>
      </circle>
    </g>
  );
}

/**
 * Silueta de davant i d'esquena amb les zones marcades. Per al dolor, com més intens
 * el color, més alta l'EVA màxima. També serveix per a les zones tractades.
 */
export function BodyMap({ zones, tone = "dolor" }: { zones: ZonaDolor[]; tone?: "dolor" | "tractament" }) {
  const per = new Map(zones.map((z) => [z.zona, z]));
  const vista = (titol: string, punts: Record<string, [number, number]>, ambBracos: boolean, esq: string, dre: string) => (
    <figure className="flex flex-col items-center">
      <svg viewBox="0 0 100 220" className="h-56 w-auto print:h-40" role="img" aria-label={`Vista ${titol}`}>
        <Silueta />
        <text x={8} y={14} className="fill-muted" fontSize={8}>{esq}</text>
        <text x={86} y={14} className="fill-muted" fontSize={8}>{dre}</text>
        {Object.entries(punts).map(([zona, [x, y]]) => (per.has(zona) ? <Punt key={zona} x={x} y={y} z={per.get(zona)!} tone={tone} /> : null))}
        {ambBracos && per.has("colze_canell") && BRACOS.map(([x, y], i) => <Punt key={i} x={x} y={y} z={per.get("colze_canell")!} tone={tone} />)}
      </svg>
      <figcaption className="display text-xs text-muted">{titol}</figcaption>
    </figure>
  );
  return (
    <div>
      <div className="flex justify-center gap-6">
        {vista("Davant", DAVANT, true, "D", "E")}
        {vista("Esquena", ESQUENA, false, "E", "D")}
      </div>
      {zones.length > 0 && (
        <ul className="mt-3 flex flex-wrap justify-center gap-1.5 text-xs">
          {zones.map((z) => (
            <li key={z.zona} className={tone === "dolor" ? "rounded-full bg-danger-soft px-2.5 py-1 text-danger" : "rounded-full bg-accent-soft px-2.5 py-1 text-accent"}>
              {labelOf(ZONES_COS, z.zona)} · {z.dies} {z.dies === 1 ? "dia" : "dies"}
              {tone === "dolor" && ` · EVA ${z.maxEva}`}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
