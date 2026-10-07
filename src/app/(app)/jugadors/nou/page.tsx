import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { PlayerForm } from "../player-form";

export const metadata: Metadata = { title: "Nou jugador" };

export default function NouJugador() {
  return (
    <>
      <PageHeader title="Nou jugador" back={{ href: "/jugadors", label: "Jugadors" }} />
      <PlayerForm />
    </>
  );
}
