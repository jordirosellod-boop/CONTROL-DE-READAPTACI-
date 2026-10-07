import { notFound } from "next/navigation";
import { Card, PageHeader } from "@/components/ui";
import { VideoEmbed } from "@/components/video";
import { getDb } from "@/lib/data";
import type { Exercise } from "@/lib/types";
import { ExerciseForm } from "../exercise-form";

export default async function EditarExercici({ params }: PageProps<"/exercicis/[eid]">) {
  const { eid } = await params;
  const { supabase } = await getDb();
  const { data } = await supabase.from("exercises").select("*").eq("id", eid).maybeSingle();
  if (!data) notFound();
  const exercise = data as Exercise;
  return (
    <>
      <PageHeader title={exercise.nom} back={{ href: "/exercicis", label: "Biblioteca" }} />
      <div className="grid max-w-4xl gap-4 md:grid-cols-2">
        <Card>
          <ExerciseForm exercise={exercise} />
        </Card>
        {exercise.video_url && (
          <Card title="Vídeo">
            <VideoEmbed url={exercise.video_url} title={exercise.nom} />
          </Card>
        )}
      </div>
    </>
  );
}
