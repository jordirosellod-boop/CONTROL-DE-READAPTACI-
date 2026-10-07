import type { Metadata } from "next";
import { ActionForm, ChipMultiSelect, ScaleInput, SubmitButton } from "@/components/forms";
import { Card, Field, Input, PageHeader, Textarea } from "@/components/ui";
import { saveWellness } from "@/lib/actions";
import { formatDate, todayISO } from "@/lib/calc";
import { WELLNESS_ITEMS, ZONES_COS } from "@/lib/constants";
import { getPlayer, getWellnessFor } from "@/lib/data";

export const metadata: Metadata = { title: "Wellness" };

export default async function WellnessPage({ params, searchParams }: PageProps<"/jugadors/[id]/wellness">) {
  const { id } = await params;
  const sp = await searchParams;
  const today = todayISO();
  const date = typeof sp.data === "string" && /^\d{4}-\d{2}-\d{2}$/.test(sp.data) ? sp.data : today;
  const tornar = sp.tornar === "dashboard" ? "dashboard" : "jugador";
  const [player, existing] = await Promise.all([getPlayer(id), getWellnessFor(id, date)]);

  return (
    <>
      <PageHeader
        title={`Wellness · ${player.nom}`}
        subtitle={existing ? `Editant el registre del ${formatDate(date)}` : formatDate(date, { weekday: "long", day: "numeric", month: "long" })}
        back={tornar === "dashboard" ? { href: "/", label: "Panell" } : { href: `/jugadors/${id}?tab=wellness`, label: "Fitxa" }}
      />
      {/* key: reinicia el formulari en canviar de dia */}
      <ActionForm key={date} action={saveWellness.bind(null, id)} className="max-w-2xl">
        <input type="hidden" name="tornar" value={tornar} />
        <Card>
          <div className="space-y-5">
            <Field label="Data">
              <Input name="data" type="date" required max={today} defaultValue={date} className="max-w-48" />
            </Field>
            {WELLNESS_ITEMS.map((item) => (
              <fieldset key={item.key}>
                <legend className="mb-1.5 text-sm font-medium">{item.label}</legend>
                <ScaleInput name={item.key} min={1} max={5} defaultValue={existing?.[item.key]} low={`1 · ${item.baix}`} high={`5 · ${item.alt}`} />
              </fieldset>
            ))}
            <Field label="Hores de son">
              <Input name="son_hores" type="number" inputMode="decimal" step="0.5" min={0} max={24} defaultValue={existing?.son_hores ?? ""} className="max-w-32" placeholder="7.5" />
            </Field>
          </div>
        </Card>
        <Card>
          <fieldset className="mb-5">
            <legend className="mb-1.5 text-sm font-medium">Dolor / molèsties (EVA 0–10)</legend>
            <ScaleInput name="dolor_eva" min={0} max={10} invert defaultValue={existing?.dolor_eva ?? 0} low="0 · Sense dolor" high="10 · Màxim dolor" />
          </fieldset>
          <fieldset>
            <legend className="mb-2 text-sm font-medium">Zona del cos</legend>
            <ChipMultiSelect name="dolor_zones" options={ZONES_COS} defaultValue={existing?.dolor_zones ?? []} />
          </fieldset>
        </Card>
        <Field label="Comentari (opcional)">
          <Textarea name="comentari" rows={2} defaultValue={existing?.comentari ?? ""} />
        </Field>
        <SubmitButton className="w-full sm:w-auto">{existing ? "Actualitzar wellness" : "Desar wellness"}</SubmitButton>
      </ActionForm>
    </>
  );
}
