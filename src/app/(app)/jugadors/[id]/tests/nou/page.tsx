import type { Metadata } from "next";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Card, Field, Input, PageHeader, Select, Textarea } from "@/components/ui";
import { saveTests } from "@/lib/actions";
import { todayISO } from "@/lib/calc";
import { TESTS_SUGGERITS, TIPUS_TEST } from "@/lib/constants";
import { activeInjury, getDb, getPlayer } from "@/lib/data";
import type { Injury } from "@/lib/types";

export const metadata: Metadata = { title: "Nou test" };

export default async function NouTest({ params }: PageProps<"/jugadors/[id]/tests/nou">) {
  const { id } = await params;
  const { supabase } = await getDb();
  const [player, injuries, prev] = await Promise.all([
    getPlayer(id),
    supabase.from("ra_injuries").select("*").eq("player_id", id),
    supabase.from("ra_tests").select("nom").eq("player_id", id),
  ]);
  const injury = activeInjury((injuries.data ?? []) as Injury[]);
  const noms = [...new Set([...(prev.data ?? []).map((t) => t.nom as string), ...TESTS_SUGGERITS])];

  return (
    <>
      <PageHeader title="Nou test" subtitle={`${player.nom} ${player.cognoms}`} back={{ href: `/jugadors/${id}?tab=tests`, label: "Tests" }} />
      <ActionForm action={saveTests.bind(null, id)} className="max-w-2xl">
        <input type="hidden" name="injury_id" value={injury?.id ?? ""} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Tipologia">
            <Select name="tipus" options={TIPUS_TEST} required defaultValue="forca" />
          </Field>
          <Field label="Nom del test" hint="Fes servir sempre el mateix nom per poder comparar.">
            <Input name="nom" required list="tests-suggerits" placeholder="p. ex. Single hop" />
            <datalist id="tests-suggerits">
              {noms.map((n) => (
                <option key={n} value={n} />
              ))}
            </datalist>
          </Field>
          <Field label="Unitat">
            <Input name="unitat" placeholder="cm, kg, N, s, °..." />
          </Field>
          <Field label="Millor resultat quan el valor és…">
            <Select
              name="millor_si"
              defaultValue="mes"
              options={[
                { value: "mes", label: "Més alt (salt, força, ROM)" },
                { value: "menys", label: "Més baix (temps)" },
              ]}
            />
          </Field>
          <Field label="Data">
            <Input name="data" type="date" required max={todayISO()} defaultValue={todayISO()} />
          </Field>
          <label className="flex items-center gap-3 self-end rounded-xl border border-border px-3 py-2.5">
            <input type="checkbox" name="es_baseline" className="h-5 w-5 accent-[var(--accent)]" />
            <span className="text-sm">
              <span className="font-medium">És valor baseline</span>
              <span className="block text-xs text-muted">Pre-lesió o valor inicial de referència</span>
            </span>
          </label>
        </div>

        <Card title="Resultat">
          <p className="mb-3 text-sm text-muted">Omple el valor bilateral, o bé els dos costats per calcular el LSI (simetria).</p>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Bilateral">
              <Input name="valor_bilateral" type="number" inputMode="decimal" step="any" />
            </Field>
            <Field label="Costat lesionat">
              <Input name="valor_lesionat" type="number" inputMode="decimal" step="any" />
            </Field>
            <Field label="Costat sa">
              <Input name="valor_sa" type="number" inputMode="decimal" step="any" />
            </Field>
          </div>
        </Card>
        <Field label="Notes">
          <Textarea name="notes" rows={2} />
        </Field>
        <SubmitButton>Desar test</SubmitButton>
      </ActionForm>
    </>
  );
}
