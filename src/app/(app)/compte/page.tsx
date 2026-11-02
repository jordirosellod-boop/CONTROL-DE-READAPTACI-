import type { Metadata } from "next";
import { cookies } from "next/headers";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Button, Card, Field, Input, PageHeader } from "@/components/ui";
import { changePassword, logout } from "@/lib/actions";
import { getDb } from "@/lib/data";
import { Avisos } from "./avisos";
import { TriaTema } from "./tema";

export const metadata: Metadata = { title: "El meu compte" };

export default async function Compte() {
  const { email } = await getDb();
  const tema = (await cookies()).get("tema")?.value ?? "auto";
  return (
    <>
      <PageHeader title="El meu compte" subtitle={email} />
      <Card title="Aparença" className="mb-4 max-w-md">
        <TriaTema inicial={tema} />
      </Card>
      <Card title="Avisos al mòbil" className="mb-4 max-w-md">
        <Avisos />
      </Card>
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
      <Card title="Sessió" className="mt-4 max-w-md">
        <p className="mb-3 text-sm text-muted">Has entrat com a {email}.</p>
        <form action={logout}>
          <Button variant="secondary" className="w-full sm:w-auto">
            Sortir de l&apos;app
          </Button>
        </form>
      </Card>
    </>
  );
}
