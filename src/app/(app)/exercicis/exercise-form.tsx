import { ActionForm, SubmitButton } from "@/components/forms";
import { ImatgeInput } from "@/components/imatge-input";
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
      <ImatgeInput actual={exercise?.imatge_url} />
      <Field label="Descripció / indicacions tècniques">
        <Textarea name="descripcio" rows={2} defaultValue={exercise?.descripcio ?? ""} />
      </Field>
      <SubmitButton>{exercise ? "Desar canvis" : "Afegir a la biblioteca"}</SubmitButton>
    </ActionForm>
  );
}
