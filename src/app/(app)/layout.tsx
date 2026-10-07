import Image from "next/image";
import Link from "next/link";
import { logout } from "@/lib/actions";
import { getDb } from "@/lib/data";

const navLink = "rounded-lg px-3 py-2 text-sm font-medium text-brand-fg/85 hover:bg-white/10 hover:text-brand-fg";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { email } = await getDb();
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 bg-brand text-brand-fg shadow-sm">
        <nav className="mx-auto flex max-w-6xl items-center gap-1 px-4 py-2">
          <Link href="/" className="mr-2 flex items-center gap-2 font-semibold">
            <Image src="/escut.png" alt="Escut del club" width={36} height={36} priority className="h-9 w-9 object-contain" />
            <span className="hidden sm:inline">Readaptació</span>
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
            <button className={navLink} title={email}>
              Sortir
            </button>
          </form>
        </nav>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-5">{children}</main>
    </div>
  );
}
