"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Avatar } from "./avatar";
import { TopNav } from "./nav";
import { cx } from "./ui";

/**
 * Capçalera de l'app: blau del club amb degradat i ratlles, escut en forma d'insígnia
 * que "penja" de la barra, línia daurada i el teu avatar. En fer scroll es compacta.
 */
export function Capcalera({ nom, foto, email, data, sortir }: { nom: string; foto: string | null; email: string; data: string; sortir: React.ReactNode }) {
  const [compacta, setCompacta] = useState(false);
  useEffect(() => {
    const onScroll = () => setCompacta(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="sticky top-0 z-20 pt-[env(safe-area-inset-top)] text-white print:hidden">
      {/* Fons: degradat del club + ratlles + resplendor darrere l'escut */}
      <div aria-hidden className={cx("absolute inset-0 bg-[linear-gradient(115deg,#06164f_0%,#0a2ea0_58%,#1747c9_100%)] transition-shadow duration-300", compacta ? "shadow-[0_8px_24px_rgba(6,22,79,0.45)]" : "shadow-[0_4px_14px_rgba(6,22,79,0.25)]")} />
      <div aria-hidden className="stripes absolute inset-0" />
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-[3px] bg-[linear-gradient(90deg,transparent,#e0b36e_20%,#f3d39b_50%,#e0b36e_80%,transparent)]" />

      <nav className={cx("relative mx-auto flex max-w-6xl items-center gap-3 px-4 transition-[height] duration-300", compacta ? "h-14" : "h-[4.5rem]")}>
        {/* Escut en insígnia que sobresurt per sota */}
        <Link href="/" aria-label="Inici" className="relative h-full w-[3.75rem] shrink-0">
          <span aria-hidden className="absolute -inset-x-6 -inset-y-2 bg-[radial-gradient(closest-side,rgba(224,179,110,0.35),transparent)]" />
          <span
            className={cx(
              "absolute left-0 grid place-items-center rounded-full bg-white shadow-[0_6px_16px_rgba(6,22,79,0.45)] ring-[3px] ring-[#e0b36e] transition-all duration-300",
              compacta ? "top-1.5 h-11 w-11" : "top-3 h-[3.75rem] w-[3.75rem]",
            )}
          >
            <Image src="/escut.png" alt="Escut CE Europa" width={64} height={64} priority className={cx("object-contain transition-all duration-300", compacta ? "h-8 w-8" : "h-11 w-11")} />
          </span>
        </Link>

        <Link href="/" className="min-w-0 leading-none">
          <span className={cx("display block overflow-hidden text-[11px] tracking-[0.22em] text-[#e0b36e] transition-all duration-300", compacta ? "max-h-0 opacity-0" : "max-h-4 opacity-100")}>
            CE EUROPA
          </span>
          <span className={cx("display block truncate tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)] transition-all duration-300", compacta ? "text-xl" : "text-[1.7rem]")}>Readaptació</span>
        </Link>

        <TopNav />

        <div className="ml-auto flex items-center gap-2.5">
          <span className="hidden text-right text-xs leading-tight text-white/75 sm:block">
            <span className="display block text-[13px] text-white">{nom}</span>
            {data}
          </span>
          <Link href="/compte" aria-label="El meu compte" title={email} className="rounded-full transition active:scale-95">
            <Avatar nom={nom} foto={foto} size="sm" />
          </Link>
          <span className="hidden sm:block">{sortir}</span>
        </div>
      </nav>
    </header>
  );
}
