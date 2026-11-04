import type { Metadata } from "next";
import Link from "next/link";
import { ActionButton } from "@/components/forms";
import { Badge, Card, Empty, PageHeader } from "@/components/ui";
import { deleteExercise, deletePlantilla } from "@/lib/actions";
import { getDb, getExercises } from "@/lib/data";
import { ExerciseForm } from "./exercise-form";

export const metadata: Metadata = { title: "Exercicis" };

export default async function Exercicis() {
  const { supabase } = await getDb();
  const [exercises, { data: plantilles }] = await Promise.all([getExercises(), supabase.from("ra_plantilles").select("id, nom, durada_min, exercicis").order("nom")]);
  const llistaPlantilles = (plantilles ?? []) as { id: string; nom: string; durada_min: number | null; exercicis: { nom: string }[] }[];
  return (
    <>
      <PageHeader title="Biblioteca d'exercicis" subtitle="Exercicis reutilitzables amb imatge de demostració" />
      <div className="grid gap-4 lg:grid-cols-[1fr_400px]">
        <Card title={`Exercicis (${exercises.length})`}>
          {exercises.length === 0 ? (
            <Empty>La biblioteca és buida. Afegeix exercicis aquí o directament des d&apos;una sessió.</Empty>
          ) : (
            <ul className="divide-y divide-border">
              {exercises.map((e) => (
                <li key={e.id} className="flex items-center gap-3 py-2.5">
                  {e.imatge_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={e.imatge_url} alt="" className="h-12 w-12 shrink-0 rounded-xl border border-border object-cover" />
                  ) : (
                    <span aria-hidden className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-surface-2 text-lg text-muted">🏋️</span>
                  )}
                  <Link href={`/exercicis/${e.id}`} className="min-w-0 flex-1 hover:underline">
                    <span className="block truncate font-medium">{e.nom}</span>
                    {e.descripcio && <span className="block truncate text-sm text-muted">{e.descripcio}</span>}
                  </Link>
                  {e.categoria && <Badge>{e.categoria}</Badge>}
                  <ActionButton action={deleteExercise.bind(null, e.id)} variant="ghost" confirm={`Eliminar «${e.nom}» de la biblioteca? Les sessions existents el conserven.`}>
                    ✕
                  </ActionButton>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <div className="space-y-4">
          <Card title="Nou exercici">
            <ExerciseForm />
          </Card>
          <Card title={`⭐ Plantilles de sessió (${llistaPlantilles.length})`}>
            {llistaPlantilles.length === 0 ? (
              <p className="text-sm text-muted">Obre una sessió amb exercicis i toca «⭐ Plantilla» per desar-la. Després la podràs aplicar a qualsevol jugador en crear una sessió nova.</p>
            ) : (
              <ul className="divide-y divide-border">
                {llistaPlantilles.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 py-2.5">
                    <span className="min-w-0 flex-1">
                      <span className="display block truncate text-heading">{p.nom}</span>
                      <span className="block truncate text-xs text-muted">
                        {p.exercicis.length} exercicis{p.durada_min ? ` · ${p.durada_min}'` : ""} · {p.exercicis.map((e) => e.nom).join(", ")}
                      </span>
                    </span>
                    <ActionButton action={deletePlantilla.bind(null, p.id)} variant="ghost" confirm={`Eliminar la plantilla «${p.nom}»? Les sessions ja creades no canvien.`}>
                      ✕
                    </ActionButton>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
