import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Empty, LinkButton, PageHeader } from "@/components/ui";
import { formatDate } from "@/lib/calc";
import { CAMES, POSICIONS, labelOf } from "@/lib/constants";
import { activeInjury, getDb } from "@/lib/data";
import type { Injury, Player } from "@/lib/types";

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
        <Empty>{showArchived ? "No hi ha jugadors arxivats." : "Encara no hi ha jugadors."}</Empty>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
          {players.map((p) => {
            const inj = activeInjury(p.injuries);
            return (
              <li key={p.id}>
                <Link href={`/jugadors/${p.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-surface-2">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">
                      {p.nom} {p.cognoms}
                    </div>
                    <div className="truncate text-sm text-muted">
                      {labelOf(POSICIONS, p.posicio)} · Cama {labelOf(CAMES, p.cama_dominant).toLowerCase()}
                      {p.edat ? ` · ${p.edat} anys` : ""}
                    </div>
                  </div>
                  {inj ? (
                    <Badge tone="warn">
                      {inj.diagnostic} · des del {formatDate(inj.data_lesio, { day: "numeric", month: "short" })}
                    </Badge>
                  ) : (
                    <Badge tone="ok">Disponible</Badge>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
