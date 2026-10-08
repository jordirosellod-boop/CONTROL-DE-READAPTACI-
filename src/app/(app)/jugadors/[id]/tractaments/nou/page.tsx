import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { todayISO } from "@/lib/calc";
import { activeInjury, getDb, getPlayer } from "@/lib/data";
import type { Injury } from "@/lib/types";
import { TreatmentForm } from "../treatment-form";

export const metadata: Metadata = { title: "Nou tractament" };

export default async function NouTractament({ params }: PageProps<"/jugadors/[id]/tractaments/nou">) {
  const { id } = await params;
  const { supabase } = await getDb();
  const [player, injuries] = await Promise.all([getPlayer(id), supabase.from("injuries").select("*").eq("player_id", id)]);
  const injury = activeInjury((injuries.data ?? []) as Injury[]);
  return (
    <>
      <PageHeader title="Tractament a camilla" subtitle={`${player.nom} ${player.cognoms}${injury ? ` · ${injury.diagnostic}` : ""}`} back={{ href: `/jugadors/${id}?tab=tractament`, label: "Tractament" }} />
      <TreatmentForm playerId={id} injuryId={injury?.id} today={todayISO()} />
    </>
  );
}
