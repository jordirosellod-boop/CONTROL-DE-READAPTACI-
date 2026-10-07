import type { Metadata } from "next";
import Link from "next/link";
import { ActionButton } from "@/components/forms";
import { Badge, Card, Empty, PageHeader } from "@/components/ui";
import { deleteExercise } from "@/lib/actions";
import { getExercises } from "@/lib/data";
import { ExerciseForm } from "./exercise-form";

export const metadata: Metadata = { title: "Exercicis" };

export default async function Exercicis() {
  const exercises = await getExercises();
  return (
    <>
      <PageHeader title="Biblioteca d'exercicis" subtitle="Exercicis reutilitzables amb vídeo de demostració" />
      <div className="grid gap-4 lg:grid-cols-[1fr_400px]">
        <Card title={`Exercicis (${exercises.length})`}>
          {exercises.length === 0 ? (
            <Empty>La biblioteca és buida. Afegeix exercicis aquí o directament des d&apos;una sessió.</Empty>
          ) : (
            <ul className="divide-y divide-border">
              {exercises.map((e) => (
                <li key={e.id} className="flex items-center gap-3 py-2.5">
                  <Link href={`/exercicis/${e.id}`} className="min-w-0 flex-1 hover:underline">
                    <span className="block truncate font-medium">{e.nom}</span>
                    {e.descripcio && <span className="block truncate text-sm text-muted">{e.descripcio}</span>}
                  </Link>
                  {e.categoria && <Badge>{e.categoria}</Badge>}
                  {e.video_url && <Badge tone="accent">▶ Vídeo</Badge>}
                  <ActionButton action={deleteExercise.bind(null, e.id)} variant="ghost" confirm={`Eliminar «${e.nom}» de la biblioteca? Les sessions existents el conserven.`}>
                    ✕
                  </ActionButton>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card title="Nou exercici">
          <ExerciseForm />
        </Card>
      </div>
    </>
  );
}
