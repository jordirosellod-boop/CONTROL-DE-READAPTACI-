import { ActionForm, SubmitButton } from "@/components/forms";
import { Field, Input, Select, Textarea } from "@/components/ui";
import { saveInjury } from "@/lib/actions";
import { CATEGORIES_LESIO, COSTATS_LESIO } from "@/lib/constants";
import type { Injury } from "@/lib/types";

export function InjuryForm({ playerId, injury, today }: { playerId: string; injury?: Injury; today: string }) {
  return (
    <ActionForm action={saveInjury.bind(null, playerId, injury?.id ?? null)} className="max-w-2xl">
      <Field label="Diagnòstic (Dx)">
        <Input name="diagnostic" required defaultValue={injury?.diagnostic} placeholder="p. ex. Lesió grau II bíceps femoral" autoFocus={!injury} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Categoria">
          <Select name="categoria" options={CATEGORIES_LESIO} placeholder="—" defaultValue={injury?.categoria ?? ""} />
        </Field>
        <Field label="Zona">
          <Input name="zona" defaultValue={injury?.zona ?? ""} placeholder="p. ex. Isquiotibials" />
        </Field>
        <Field label="Costat">
          <Select name="costat" options={COSTATS_LESIO} placeholder="—" defaultValue={injury?.costat ?? ""} />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Data de la lesió">
          <Input name="data_lesio" type="date" required max={today} defaultValue={injury?.data_lesio ?? today} />
        </Field>
        <Field label="Data intervenció quirúrgica" hint="Opcional. Si n'hi ha, les setmanes es compten des d'aquí.">
          <Input name="data_cirurgia" type="date" defaultValue={injury?.data_cirurgia ?? ""} />
        </Field>
        <Field label="Data d'alta" hint="Deixa-ho buit mentre la lesió estigui activa.">
          <Input name="data_alta" type="date" defaultValue={injury?.data_alta ?? ""} />
        </Field>
      </div>
      <Field label="Notes">
        <Textarea name="notes" rows={3} defaultValue={injury?.notes ?? ""} />
      </Field>
      <SubmitButton>{injury ? "Desar canvis" : "Registrar lesió"}</SubmitButton>
    </ActionForm>
  );
}
