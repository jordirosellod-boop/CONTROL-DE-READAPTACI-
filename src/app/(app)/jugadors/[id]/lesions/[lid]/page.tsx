import { notFound } from "next/navigation";
import { ActionButton } from "@/components/forms";
import { PageHeader } from "@/components/ui";
import { deleteInjury } from "@/lib/actions";
import { todayISO } from "@/lib/calc";
import { getInjury, getPlayer } from "@/lib/data";
import { InjuryForm } from "../injury-form";

export default async function EditarLesio({ params }: PageProps<"/jugadors/[id]/lesions/[lid]">) {
  const { id, lid } = await params;
  const [player, injury] = await Promise.all([getPlayer(id), getInjury(lid)]);
  if (injury.player_id !== id) notFound();
  return (
    <>
      <PageHeader
        title="Editar lesió"
        subtitle={`${player.nom} ${player.cognoms}`}
        back={{ href: `/jugadors/${id}?tab=lesions`, label: "Lesions" }}
        actions={
          <ActionButton action={deleteInjury.bind(null, id, lid)} variant="danger" confirm="Eliminar aquesta lesió? Les sessions i tests es conservaran.">
            Eliminar
          </ActionButton>
        }
      />
      <InjuryForm playerId={id} injury={injury} today={todayISO()} />
    </>
  );
}
