import type { Metadata } from "next";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Field, Input, PageHeader } from "@/components/ui";
import { createSession } from "@/lib/actions";
import { todayISO } from "@/lib/calc";
import { activeInjury, getDb, getPlayer } from "@/lib/data";
import type { Injury } from "@/lib/types";

export const metadata: Metadata = { title: "Nova sessió" };

export default async function NovaSessio({ params }: PageProps<"/jugadors/[id]/sessions/nova">) {
  const { id } = await params;
  const { supabase } = await getDb();
  const [player, injuries] = await Promise.all([getPlayer(id), supabase.from("ra_injuries").select("*").eq("player_id", id)]);
  const injury = activeInjury((injuries.data ?? []) as Injury[]);
  return (
    <>
      <PageHeader title="Nova sessió" subtitle={`${player.nom} ${player.cognoms}${injury ? ` · ${injury.diagnostic}` : ""}`} back={{ href: `/jugadors/${id}?tab=sessions`, label: "Sessions" }} />
      <ActionForm action={createSession.bind(null, id)} className="max-w-xl">
        <input type="hidden" name="injury_id" value={injury?.id ?? ""} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Data">
            <Input name="data" type="date" required defaultValue={todayISO()} />
          </Field>
          <Field label="Nom de la sessió" hint="Opcional">
            <Input name="nom" placeholder="p. ex. Força + carrera contínua" />
          </Field>
        </div>
        <SubmitButton>Crear i afegir exercicis</SubmitButton>
      </ActionForm>
    </>
  );
}
