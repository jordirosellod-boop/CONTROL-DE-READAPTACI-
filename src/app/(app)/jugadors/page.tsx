import type { Metadata } from "next";
import { Empty, LinkButton, PageHeader } from "@/components/ui";
import { formatDate } from "@/lib/calc";
import { CAMES, POSICIONS, labelOf } from "@/lib/constants";
import { activeInjury, getDb } from "@/lib/data";
import type { Injury, Player } from "@/lib/types";
import { LlistaJugadors } from "./llista";

export const metadata: Metadata = { title: "Jugadors" };

export default async function Jugadors({ searchParams }: PageProps<"/jugadors">) {
  const { arxivats } = await searchParams;
  const showArchived = arxivats === "1";
  const { supabase } = await getDb();
  const { data, error } = await supabase.from("ra_players").select("*, injuries:ra_injuries(*)").eq("arxivat", showArchived).order("nom");
  if (error) throw new Error(error.message);
  const players = data as (Player & { injuries: Injury[] })[];

  return (
    <>
      <PageHeader
        title={showArchived ? "Jugadors arxivats" : "Jugadors"}
        actions={
          <>
            <LinkButton href={showArchived ? "/jugadors" : "/jugadors?arxivats=1"} variant="ghost">
              {showArchived ? "Veure actius" : "Veure arxivats"}
            </LinkButton>
            <LinkButton href="/jugadors/nou">+ Nou jugador</LinkButton>
          </>
        }
      />
      {players.length === 0 ? (
        <Empty big>{showArchived ? "No hi ha jugadors arxivats." : "Encara no hi ha jugadors. Toca «+ Nou jugador» per crear-ne un."}</Empty>
      ) : (
        <LlistaJugadors
          files={players.map((p) => {
            const inj = activeInjury(p.injuries);
            return {
              id: p.id,
              nom: p.nom,
              cognoms: p.cognoms,
              foto_url: p.foto_url,
              dorsal: p.dorsal,
              subtitol:
                [p.equip, labelOf(POSICIONS, p.posicio), p.edat ? `${p.edat} anys` : null].filter((x) => x && x !== "—").join(" · ") ||
                `Cama ${labelOf(CAMES, p.cama_dominant).toLowerCase()}`,
              lesio: inj ? `${inj.diagnostic} · des del ${formatDate(inj.data_lesio, { day: "numeric", month: "short" })}` : null,
            };
          })}
        />
      )}
    </>
  );
}
