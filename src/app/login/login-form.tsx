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
    // En sortir, s'esborren les pàgines desades al mòbil (són dades de salut)
    navigator.serviceWorker?.controller?.postMessage("esborra-pagines");
    if ("caches" in window) void caches.delete("ra-pagines");
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
