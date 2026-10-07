import Link from "next/link";
import { logout } from "@/lib/actions";
import { getDb } from "@/lib/data";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { email } = await getDb();
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-border bg-surface/90 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center gap-1 px-4 py-2">
          <Link href="/" className="mr-3 flex items-center gap-2 font-semibold">
            <span aria-hidden className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-sm text-accent-fg">
              R
            </span>
            <span className="hidden sm:inline">Readaptació</span>
          </Link>
          <Link href="/" className="rounded-lg px-3 py-2 text-sm hover:bg-surface-2">
            Panell
          </Link>
          <Link href="/jugadors" className="rounded-lg px-3 py-2 text-sm hover:bg-surface-2">
            Jugadors
          </Link>
          <Link href="/exercicis" className="rounded-lg px-3 py-2 text-sm hover:bg-surface-2">
            Exercicis
          </Link>
          <form action={logout} className="ml-auto">
            <button className="rounded-lg px-3 py-2 text-sm text-muted hover:bg-surface-2 hover:text-foreground" title={email}>
              Sortir
            </button>
          </form>
        </nav>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-5">{children}</main>
    </div>
  );
}
