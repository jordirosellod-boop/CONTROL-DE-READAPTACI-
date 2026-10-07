import { ActionForm, SubmitButton } from "@/components/forms";
import { Field, Input, Textarea } from "@/components/ui";
import { saveExercise } from "@/lib/actions";
import type { Exercise } from "@/lib/types";

export function ExerciseForm({ exercise }: { exercise?: Exercise }) {
  return (
    <ActionForm action={saveExercise.bind(null, exercise?.id ?? null)} resetOnSuccess={!exercise}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nom">
          <Input name="nom" required defaultValue={exercise?.nom} />
        </Field>
        <Field label="Categoria">
          <Input name="categoria" defaultValue={exercise?.categoria ?? ""} placeholder="Força, Pliometria, Mobilitat..." list="categories-exercici" />
          <datalist id="categories-exercici">
            {["Força", "Isomètric", "Excèntric", "Pliometria", "Mobilitat", "Estabilitat / Core", "Propiocepció", "Carrera", "Específic"].map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </Field>
      </div>
      <Field label="Vídeo / enllaç de demostració" hint="YouTube i Vimeo es veuen incrustats.">
        <Input name="video_url" type="url" defaultValue={exercise?.video_url ?? ""} placeholder="https://youtu.be/..." />
      </Field>
      <Field label="Descripció / indicacions tècniques">
        <Textarea name="descripcio" rows={2} defaultValue={exercise?.descripcio ?? ""} />
      </Field>
      <SubmitButton>{exercise ? "Desar canvis" : "Afegir a la biblioteca"}</SubmitButton>
    </ActionForm>
  );
}
