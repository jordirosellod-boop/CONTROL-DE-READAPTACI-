"use client";

import { Button } from "@/components/ui";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-md py-12 text-center">
      <h1 className="text-xl font-semibold">Alguna cosa ha fallat</h1>
      <p className="mt-2 text-sm text-muted">No s&apos;han pogut carregar les dades. Comprova la connexió i torna-ho a provar.</p>
      {error.digest && <p className="mt-1 text-xs text-muted">Codi: {error.digest}</p>}
      <Button className="mt-4" onClick={reset}>
        Tornar-ho a provar
      </Button>
    </div>
  );
}
