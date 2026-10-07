import { ActionButton } from "@/components/forms";
import { Card, PageHeader } from "@/components/ui";
import { deletePlayer, setPlayerArchived } from "@/lib/actions";
import { getPlayer } from "@/lib/data";
import { PlayerForm } from "../../player-form";

export default async function EditarJugador({ params }: PageProps<"/jugadors/[id]/editar">) {
  const { id } = await params;
  const player = await getPlayer(id);
  return (
    <>
      <PageHeader title={`Editar ${player.nom}`} back={{ href: `/jugadors/${id}`, label: "Fitxa" }} />
      <PlayerForm player={player} />
      <Card title="Zona de perill" className="mt-8 max-w-2xl">
        <p className="mb-3 text-sm text-muted">Arxivar amaga el jugador del panell sense perdre dades. Eliminar esborra definitivament totes les seves dades.</p>
        <div className="flex flex-wrap gap-2">
          <ActionButton action={setPlayerArchived.bind(null, id, !player.arxivat)}>{player.arxivat ? "Recuperar jugador" : "Arxivar jugador"}</ActionButton>
          <ActionButton action={deletePlayer.bind(null, id)} variant="danger" confirm={`Segur que vols eliminar ${player.nom} i totes les seves dades? No es pot desfer.`}>
            Eliminar definitivament
          </ActionButton>
        </div>
      </Card>
    </>
  );
}
