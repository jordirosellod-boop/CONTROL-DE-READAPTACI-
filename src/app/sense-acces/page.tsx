import type { Metadata } from "next";
import Image from "next/image";
import { logout } from "@/lib/actions";

export const metadata: Metadata = { title: "Sense accés" };

export default function SenseAcces() {
  return (
    <main className="stripes grid min-h-dvh place-items-center bg-brand px-4 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] text-center text-brand-fg">
      <div className="max-w-sm">
        <Image src="/escut.png" alt="Escut CE Europa" width={96} height={96} className="mx-auto mb-4 h-24 w-24 object-contain" />
        <h1 className="display text-3xl">Sense accés</h1>
        <p className="mt-2 text-brand-fg/85">Aquest usuari no està autoritzat a fer servir l&apos;app de readaptació. Parla amb el responsable perquè t&apos;afegeixi.</p>
        <form action={logout} className="mt-6">
          <button className="display rounded-full border-2 border-brand-fg px-6 py-2 hover:bg-brand-fg hover:text-brand">Sortir</button>
        </form>
      </div>
    </main>
  );
}
