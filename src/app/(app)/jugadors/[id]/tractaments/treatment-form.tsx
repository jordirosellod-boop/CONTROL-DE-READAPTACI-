import { ActionForm, ChipMultiSelect, ScaleInput, SubmitButton } from "@/components/forms";
import { Card, Field, Input, Textarea } from "@/components/ui";
import { saveTreatment } from "@/lib/actions";
import { TECNIQUES, ZONES_COS } from "@/lib/constants";
import type { Treatment } from "@/lib/types";

export function TreatmentForm({ playerId, injuryId, treatment, today }: { playerId: string; injuryId?: string | null; treatment?: Treatment; today: string }) {
  return (
    <ActionForm action={saveTreatment.bind(null, playerId, treatment?.id ?? null)} className="max-w-2xl">
      <input type="hidden" name="injury_id" value={injuryId ?? ""} />
      <div className="grid grid-cols-2 gap-4">
        <Field label="Data">
          <Input name="data" type="date" required max={today} defaultValue={treatment?.data ?? today} />
        </Field>
        <Field label="Durada (min)">
          <Input name="durada_min" type="number" inputMode="numeric" min={0} max={300} defaultValue={treatment?.durada_min ?? ""} placeholder="30" />
        </Field>
      </div>
      <Card title="Tècniques aplicades">
        <ChipMultiSelect name="tecniques" options={TECNIQUES} defaultValue={treatment?.tecniques ?? []} />
      </Card>
      <Card title="Zona tractada">
        <ChipMultiSelect name="zones" options={ZONES_COS} defaultValue={treatment?.zones ?? []} />
      </Card>
      <Card title="Dolor (EVA 0–10)">
        <div className="space-y-5">
          <fieldset>
            <legend className="mb-1.5 text-sm font-medium">Abans del tractament</legend>
            <ScaleInput name="dolor_abans" min={0} max={10} invert required={false} defaultValue={treatment?.dolor_abans} low="0 · Sense dolor" high="10 · Màxim" />
          </fieldset>
          <fieldset>
            <legend className="mb-1.5 text-sm font-medium">Després del tractament</legend>
            <ScaleInput name="dolor_despres" min={0} max={10} invert required={false} defaultValue={treatment?.dolor_despres} low="0 · Sense dolor" high="10 · Màxim" />
          </fieldset>
        </div>
      </Card>
      <Field label="Observacions" hint="Troballes, paràmetres de l'aparell, resposta del jugador, pautes per a casa...">
        <Textarea name="notes" rows={4} defaultValue={treatment?.notes ?? ""} />
      </Field>
      <SubmitButton className="w-full sm:w-auto">{treatment ? "Desar canvis" : "Desar tractament"}</SubmitButton>
    </ActionForm>
  );
}
