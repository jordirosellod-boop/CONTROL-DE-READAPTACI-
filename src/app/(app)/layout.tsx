import Image from "next/image";
import Link from "next/link";
import { BottomNav, TopNav } from "@/components/nav";
import { logout } from "@/lib/actions";
import { getDb } from "@/lib/data";

const pill = "display inline-flex min-h-9 items-center rounded-full border-2 border-brand-fg/90 px-4 text-sm text-brand-fg hover:bg-brand-fg hover:text-brand";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { email } = await getDb();
  return (
    <div className="flex min-h-dvh flex-col pb-[calc(4.25rem+env(safe-area-inset-bottom))] sm:pb-0">
      <header className="stripes sticky top-0 z-20 bg-brand pt-[env(safe-area-inset-top)] text-brand-fg shadow-[0_2px_12px_rgba(11,27,77,0.25)]">
        <nav className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
          {/* L'escut sobresurt de la barra, com a la web del club */}
          <Link href="/" className="relative h-16 w-14 shrink-0 sm:w-20" aria-label="Inici">
            <Image src="/escut.png" alt="Escut CE Europa" width={80} height={80} priority className="absolute top-2 left-0 h-14 w-14 object-contain drop-shadow-md sm:h-[76px] sm:w-[76px]" />
          </Link>
          <Link href="/" className="leading-none sm:hidden">
            <span className="display block text-[11px] text-[#e0b36e]">CE Europa</span>
            <span className="display block text-xl">Readaptació</span>
          </Link>
          <TopNav />
          <form action={logout} className="ml-auto hidden sm:block">
            <button className={pill} title={email}>
              Sortir
            </button>
          </form>
        </nav>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-7 pb-10 sm:pt-9">{children}</main>
      <footer className="stripes hidden bg-brand text-brand-fg sm:block">
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
    </div>
  );
}
