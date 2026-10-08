import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ActionButton } from "@/components/forms";
import { PageHeader } from "@/components/ui";
import { deleteTreatment } from "@/lib/actions";
import { formatDate, todayISO } from "@/lib/calc";
import { getPlayer, getTreatment } from "@/lib/data";
import { TreatmentForm } from "../treatment-form";

export const metadata: Metadata = { title: "Tractament" };

export default async function EditarTractament({ params }: PageProps<"/jugadors/[id]/tractaments/[tid]">) {
  const { id, tid } = await params;
  const [player, treatment] = await Promise.all([getPlayer(id), getTreatment(tid)]);
  if (treatment.player_id !== id) notFound();
  return (
    <>
      <PageHeader
        title="Tractament a camilla"
        subtitle={`${player.nom} ${player.cognoms} · ${formatDate(treatment.data)}`}
        back={{ href: `/jugadors/${id}?tab=tractament`, label: "Tractament" }}
        actions={
          <ActionButton action={deleteTreatment.bind(null, id, tid)} variant="danger" confirm="Eliminar aquest tractament?">
            Eliminar
          </ActionButton>
        }
      />
      <TreatmentForm playerId={id} treatment={treatment} today={todayISO()} />
    </>
  );
}
