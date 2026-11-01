import type { Metadata } from "next";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Card, Field, Input, PageHeader } from "@/components/ui";
import { changePassword } from "@/lib/actions";
import { getDb } from "@/lib/data";

export const metadata: Metadata = { title: "El meu compte" };

export default async function Compte() {
  const { email } = await getDb();
  return (
    <>
      <PageHeader title="El meu compte" subtitle={email} />
      <Card title="Canviar la contrasenya" className="max-w-md">
        <ActionForm action={changePassword} resetOnSuccess>
          <Field label="Contrasenya nova" hint="Almenys 8 caràcters.">
            <Input type="password" name="password" autoComplete="new-password" minLength={8} required />
          </Field>
          <Field label="Repeteix la contrasenya nova">
            <Input type="password" name="password2" autoComplete="new-password" minLength={8} required />
          </Field>
          <SubmitButton>Canviar contrasenya</SubmitButton>
        </ActionForm>
      </Card>
    </>
  );
}
