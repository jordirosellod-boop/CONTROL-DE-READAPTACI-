import { PageHeader } from "@/components/ui";
import { todayISO } from "@/lib/calc";
import { getPlayer } from "@/lib/data";
import { InjuryForm } from "../injury-form";

export default async function NovaLesio({ params }: PageProps<"/jugadors/[id]/lesions/nova">) {
  const { id } = await params;
  const player = await getPlayer(id);
  return (
    <>
      <PageHeader title="Nova lesió" subtitle={`${player.nom} ${player.cognoms}`} back={{ href: `/jugadors/${id}?tab=lesions`, label: "Lesions" }} />
      <InjuryForm playerId={id} today={todayISO()} />
    </>
  );
}
