import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export default function ConfiguracioPage() {
  if (isSupabaseConfigured) redirect("/");
  return (
    <main className="mx-auto max-w-xl px-4 py-12">
      <h1 className="text-2xl font-semibold">Falta configurar Supabase</h1>
      <p className="mt-3 text-muted">
        L&apos;aplicació necessita una base de dades de Supabase. Crea el fitxer <code>.env.local</code> a l&apos;arrel del projecte (pots copiar
        <code> .env.example</code>) amb aquestes variables i reinicia el servidor:
      </p>
      <pre className="mt-4 overflow-x-auto rounded-xl bg-surface-2 p-4 text-sm">
        {`NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...`}
      </pre>
      <p className="mt-4 text-sm text-muted">Les instruccions completes són al README.</p>
    </main>
  );
}
