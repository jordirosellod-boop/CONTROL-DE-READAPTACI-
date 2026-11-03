import type { Metadata, Viewport } from "next";
import Image from "next/image";
import { formatDate } from "@/lib/calc";
import { infoJugador } from "@/lib/jugador";
import { FormRpe, FormWellness } from "./formularis";

export async function generateMetadata({ params }: PageProps<"/j/[token]">): Promise<Metadata> {
  const { token } = await params;
  const j = await infoJugador(token);
  return {
    title: { absolute: j ? `${j.nom} · Wellness CE Europa` : "CE Europa · Wellness" },
    manifest: j ? `/j/${token}/manifest.webmanifest` : undefined,
    robots: { index: false, follow: false },
    appleWebApp: { capable: true, title: "Wellness", statusBarStyle: "black-translucent" },
  };
}

export const viewport: Viewport = { themeColor: "#022e91" };

export default async function PaginaJugador({ params, searchParams }: PageProps<"/j/[token]">) {
  const { token } = await params;
  const sp = await searchParams;
  const j = await infoJugador(token);

  if (!j) {
    return (
      <main className="grid min-h-dvh place-items-center bg-background p-6 text-center">
        <div>
          <Image src="/escut.png" alt="CE Europa" width={80} height={80} className="mx-auto h-20 w-20" />
          <h1 className="display mt-4 text-2xl text-heading">Enllaç no vàlid</h1>
          <p className="mt-2 text-sm text-muted">Demana un enllaç nou al teu readaptador.</p>
        </div>
      </main>
    );
  }

  // Per tornar a omplir el wellness si ja estava fet
  const refer = sp.refer === "wellness";

  return (
    <main className="min-h-dvh bg-background pb-[calc(2rem+env(safe-area-inset-bottom))]">
      <header className="stripes relative overflow-hidden bg-brand px-5 pt-[calc(1.25rem+env(safe-area-inset-top))] pb-6 text-white">
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(120%_90%_at_100%_100%,rgba(11,27,77,0.85),transparent_60%)]" />
        {j.foto_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={j.foto_url} alt="" referrerPolicy="no-referrer" className="absolute right-0 bottom-0 h-[120%] max-w-[50%] object-cover object-top [mask-image:linear-gradient(to_right,transparent,black_40%)]" />
        )}
        <div className="relative mx-auto max-w-lg">
          <div className="flex items-center gap-2">
            <Image src="/escut.png" alt="" width={36} height={36} className="h-9 w-9" />
            <span className="display text-xs text-[#e0b36e]">CE Europa · Readaptació</span>
          </div>
          <h1 className="display mt-4 text-4xl leading-[0.9]">Hola, {j.nom}!</h1>
          <p className="mt-1.5 text-sm text-white/80">{formatDate(j.avui, { weekday: "long", day: "numeric", month: "long" })}</p>
        </div>
      </header>

      <div className="mx-auto max-w-lg space-y-5 px-4 pt-5">
        <section className="rounded-3xl bg-surface p-5 shadow-sm ring-1 ring-border">
          <h2 className="display text-2xl text-heading">😊 Wellness d&apos;avui</h2>
          {j.wellness_avui && !refer ? (
            <div className="mt-3 rounded-2xl bg-ok/10 p-4 text-center">
              <p className="display text-lg text-heading">✓ Ja l&apos;has fet avui. Gràcies!</p>
              <a href={`/j/${token}?refer=wellness`} className="mt-1 inline-block text-sm font-medium text-accent underline">
                M&apos;he equivocat, el vull tornar a fer
              </a>
            </div>
          ) : (
            <>
              <p className="mt-1 text-sm text-muted">Respon com et trobes aquest matí. Només són 30 segons.</p>
              <FormWellness token={token} />
            </>
          )}
        </section>

        <section className="rounded-3xl bg-surface p-5 shadow-sm ring-1 ring-border">
          <h2 className="display text-2xl text-heading">💪 Com de dura ha estat la sessió?</h2>
          <p className="mt-1 text-sm text-muted">Respon uns 30 minuts després d&apos;acabar l&apos;entrenament.</p>
          <FormRpe token={token} sessions={j.sessions} />
        </section>

        <p className="text-center text-xs text-muted">Les respostes arriben directament al teu readaptador. 💙</p>
      </div>
    </main>
  );
}
