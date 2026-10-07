import Image from "next/image";
import Link from "next/link";
import { logout } from "@/lib/actions";
import { getDb } from "@/lib/data";

const navLink = "display rounded-md px-1.5 py-2 text-sm text-brand-fg/90 hover:text-brand-fg sm:px-3 sm:text-base";
const pill = "display inline-flex min-h-9 items-center rounded-full border-2 border-brand-fg/90 px-3 text-sm text-brand-fg hover:bg-brand-fg hover:text-brand sm:px-4";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { email } = await getDb();
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-white/20 bg-brand text-brand-fg">
        <nav className="mx-auto flex h-16 max-w-6xl items-center gap-0.5 px-3 sm:gap-1 sm:px-4">
          {/* L'escut sobresurt de la barra, com a la web del club */}
          <Link href="/" className="relative mr-1 h-16 w-14 shrink-0 sm:mr-4 sm:w-20" aria-label="Inici">
            <Image src="/escut.png" alt="Escut CE Europa" width={80} height={80} priority className="absolute top-2 left-0 h-[52px] w-[52px] object-contain drop-shadow-md sm:h-[76px] sm:w-[76px]" />
          </Link>
          <Link href="/" className={navLink}>
            Panell
          </Link>
          <Link href="/jugadors" className={navLink}>
            Jugadors
          </Link>
          <Link href="/exercicis" className={navLink}>
            Exercicis
          </Link>
          <form action={logout} className="ml-auto">
            <button className={pill} title={email}>
              Sortir
            </button>
          </form>
        </nav>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-8 pb-10">{children}</main>
      <footer className="bg-brand text-brand-fg">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-6">
          <Image src="/escut.png" alt="" width={56} height={56} className="h-14 w-14 object-contain" />
          <div>
            <div className="display text-xl">CE Europa</div>
            <div className="text-sm text-brand-fg/80">Àrea de readaptació · Ús intern</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
