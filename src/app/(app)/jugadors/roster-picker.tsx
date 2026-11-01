"use client";

import { useRef, useState } from "react";
import { Avatar } from "@/components/avatar";
import { EQUIPS, PLANTILLA } from "@/lib/plantilla";

/**
 * Tria un jugador de la plantilla del club i omple el formulari (nom, cognoms,
 * dorsal, posició, equip i foto). Mostra una previsualització de la foto.
 */
export function RosterPicker({ initial }: { initial: { nom: string; cognoms: string; foto: string | null; dorsal: number | null } }) {
  const ref = useRef<HTMLDivElement>(null);
  const [preview, setPreview] = useState(initial);

  function set(name: string, value: string) {
    const el = ref.current?.closest("form")?.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement | null;
    if (el) el.value = value;
  }

  return (
    <div ref={ref} className="flex items-center gap-4 rounded-2xl bg-accent-soft p-4">
      <Avatar nom={preview.nom || "?"} cognoms={preview.cognoms} foto={preview.foto} dorsal={preview.dorsal} size="lg" />
      <label className="min-w-0 flex-1">
        <span className="mb-1 block text-sm font-medium">Triar de la plantilla del club</span>
        <select
          className="input"
          defaultValue=""
          onChange={(e) => {
            const j = PLANTILLA[Number(e.target.value)];
            if (!j) return;
            set("nom", j.nom);
            set("cognoms", j.cognoms);
            set("posicio", j.posicio);
            set("dorsal", j.dorsal?.toString() ?? "");
            set("equip", j.equip);
            set("foto_url", j.foto ?? "");
            setPreview({ nom: j.nom, cognoms: j.cognoms, foto: j.foto, dorsal: j.dorsal });
          }}
        >
          <option value="">— Escriu-lo a mà o tria&apos;l aquí —</option>
          {EQUIPS.map((equip) => (
            <optgroup key={equip} label={equip}>
              {PLANTILLA.map((j, i) =>
                j.equip === equip ? (
                  <option key={i} value={i}>
                    {j.dorsal != null ? `${j.dorsal} · ` : ""}
                    {j.nom} {j.cognoms}
                    {j.foto ? "" : " (sense foto)"}
                  </option>
                ) : null,
              )}
            </optgroup>
          ))}
        </select>
        <span className="mt-1 block text-xs text-muted">Dades i fotos de ceeuropa.cat. Si l&apos;escrius a mà, la foto es busca sola en desar.</span>
      </label>
    </div>
  );
}
