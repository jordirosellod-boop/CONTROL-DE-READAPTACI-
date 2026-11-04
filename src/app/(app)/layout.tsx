import Image from "next/image";
import Link from "next/link";
import { Benvinguda } from "@/components/benvinguda";
import { Suspense } from "react";
import { BottomNav } from "@/components/nav";
import { Capcalera } from "@/components/capcalera";
import { formatDate, todayISO } from "@/lib/calc";
import { PullToRefresh } from "@/components/gestures";
import { Connexio } from "@/components/pwa";
import { QuickActions } from "@/components/quick-actions";
import { Toaster } from "@/components/toast";
import { logout } from "@/lib/actions";
import { countEnReadaptacio, getDb, getPerfil, getPlayersLite } from "@/lib/data";

const pill = "display inline-flex min-h-9 items-center rounded-full border-2 border-white/80 px-4 text-sm text-white hover:bg-white hover:text-brand";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { email } = await getDb();
  const [perfil, enReadaptacio, jugadors] = await Promise.all([getPerfil(), countEnReadaptacio(), getPlayersLite()]);
  return (
    <div className="flex min-h-dvh flex-col pb-[calc(4.25rem+env(safe-area-inset-bottom))] sm:pb-0 print:pb-0">
      <Capcalera
        nom={perfil.nom}
        foto={perfil.foto}
        email={email}
        data={formatDate(todayISO(), { weekday: "long", day: "numeric", month: "short" })}
        sortir={
          <form action={logout}>
            <button className={pill} title={email}>
              Sortir
            </button>
          </form>
        }
      />
      <Connexio />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-7 pb-10 sm:pt-9 print:max-w-none print:p-0">{children}</main>
      <footer className="stripes hidden bg-brand text-brand-fg sm:block print:hidden">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-6">
          <Image src="/escut.png" alt="" width={56} height={56} className="h-14 w-14 object-contain" />
          <div>
            <div className="display text-xl">CE Europa</div>
            <div className="text-sm text-brand-fg/80">Àrea de readaptació · Ús intern</div>
          </div>
          <Link href="/compte" className="ml-auto text-right text-sm text-brand-fg/85 underline-offset-2 hover:underline">
            <span className="block truncate">{email}</span>
            <span className="block">El meu compte</span>
          </Link>
        </div>
      </footer>
      <BottomNav />
      <QuickActions jugadors={jugadors} />
      <PullToRefresh />
      <Suspense>
        <Toaster />
      </Suspense>
      <Benvinguda nom={perfil.nom} foto={perfil.foto} enReadaptacio={enReadaptacio} />
    </div>
  );
}
