"use client";

import { useEffect } from "react";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Field, Input } from "@/components/ui";
import { login } from "@/lib/actions";

export function LoginForm({ next }: { next: string }) {
  // En tornar a entrar, que es torni a veure la salutació
  useEffect(() => {
    try {
      sessionStorage.removeItem("ra-benvinguda");
    } catch {}
  }, []);
  return (
    <ActionForm action={login}>
      <input type="hidden" name="next" value={next} />
      <Field label="Correu electrònic">
        <Input type="email" name="email" autoComplete="email" required autoFocus />
      </Field>
      <Field label="Contrasenya">
        <Input type="password" name="password" autoComplete="current-password" required />
      </Field>
      <SubmitButton className="w-full">Entrar</SubmitButton>
    </ActionForm>
  );
}
