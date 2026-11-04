import type { Metadata } from "next";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Field, Input, PageHeader, Select } from "@/components/ui";
import { createSession } from "@/lib/actions";
import { todayISO } from "@/lib/calc";
import { activeInjury, getDb, getPlayer } from "@/lib/data";
import type { Injury } from "@/lib/types";

export const metadata: Metadata = { title: "Nova sessió" };

export default async function NovaSessio({ params, searchParams }: PageProps<"/jugadors/[id]/sessions/nova">) {
  const { id } = await params;
  const sp = await searchParams;
  const data = typeof sp.data === "string" && /^\d{4}-\d{2}-\d{2}$/.test(sp.data) ? sp.data : todayISO();
  const tornar = sp.des === "agenda" ? { href: `/agenda?setmana=${data}`, label: "Agenda" } : { href: `/jugadors/${id}?tab=sessions`, label: "Sessions" };
  const { supabase } = await getDb();
  const [player, injuries, plantilles] = await Promise.all([
    getPlayer(id),
    supabase.from("ra_injuries").select("*").eq("player_id", id),
    supabase.from("ra_plantilles").select("id, nom, exercicis").order("nom"),
  ]);
  const injury = activeInjury((injuries.data ?? []) as Injury[]);
  const llista = (plantilles.data ?? []) as { id: string; nom: string; exercicis: unknown[] }[];
  return (
    <>
      <PageHeader title="Nova sessió" subtitle={`${player.nom} ${player.cognoms}${injury ? ` · ${injury.diagnostic}` : ""}`} back={tornar} />
      <ActionForm action={createSession.bind(null, id)} className="max-w-xl">
        <input type="hidden" name="injury_id" value={injury?.id ?? ""} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Data" hint="Pots planificar-la per a un altre dia.">
            <Input name="data" type="date" required defaultValue={data} />
          </Field>
          <Field label="Nom de la sessió" hint="Opcional">
            <Input name="nom" placeholder="p. ex. Força + carrera contínua" />
          </Field>
        </div>
        {llista.length > 0 && (
          <Field label="Partir d'una plantilla" hint="S'hi afegeixen tots els exercicis de la plantilla; després els pots canviar.">
            <Select name="plantilla_id" options={llista.map((p) => ({ value: p.id, label: `${p.nom} (${p.exercicis.length} exercicis)` }))} placeholder="— Sessió en blanc —" />
          </Field>
        )}
        <SubmitButton>Crear i afegir exercicis</SubmitButton>
      </ActionForm>
    </>
  );
}
