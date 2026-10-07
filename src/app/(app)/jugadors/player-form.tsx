import { ActionForm, SubmitButton } from "@/components/forms";
import { Field, Input, Select, Textarea } from "@/components/ui";
import { savePlayer } from "@/lib/actions";
import { CAMES, POSICIONS } from "@/lib/constants";
import type { Player } from "@/lib/types";

export function PlayerForm({ player }: { player?: Player }) {
  return (
    <ActionForm action={savePlayer.bind(null, player?.id ?? null)} className="max-w-2xl">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nom">
          <Input name="nom" required defaultValue={player?.nom} autoFocus={!player} />
        </Field>
        <Field label="Cognoms">
          <Input name="cognoms" defaultValue={player?.cognoms} />
        </Field>
        <Field label="Edat">
          <Input name="edat" type="number" inputMode="numeric" min={5} max={80} defaultValue={player?.edat ?? ""} />
        </Field>
        <Field label="Posició">
          <Select name="posicio" options={POSICIONS} placeholder="—" defaultValue={player?.posicio ?? ""} />
        </Field>
        <Field label="Cama dominant">
          <Select name="cama_dominant" options={CAMES} placeholder="—" defaultValue={player?.cama_dominant ?? ""} />
        </Field>
      </div>
      <Field label="Historial de lesions previ" hint="Lesions anteriors amb dates (text lliure). Les lesions noves es registren a la pestanya Lesions.">
        <Textarea name="historial_lesions" rows={4} defaultValue={player?.historial_lesions ?? ""} placeholder="p. ex. 03/2024 – Rotura fibril·lar isquios D (4 setmanes)" />
      </Field>
      <SubmitButton>{player ? "Desar canvis" : "Crear jugador"}</SubmitButton>
    </ActionForm>
  );
}
