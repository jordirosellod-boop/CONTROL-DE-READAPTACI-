"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType, SVGProps } from "react";
import { IconCompte, IconExercicis, IconJugadors, IconPanell } from "./icons";
import { cx } from "./ui";

const ITEMS: { href: string; label: string; Icon: ComponentType<SVGProps<SVGSVGElement>>; desktop: boolean }[] = [
  { href: "/", label: "Panell", Icon: IconPanell, desktop: true },
  { href: "/jugadors", label: "Jugadors", Icon: IconJugadors, desktop: true },
  { href: "/exercicis", label: "Exercicis", Icon: IconExercicis, desktop: true },
  { href: "/compte", label: "Compte", Icon: IconCompte, desktop: false },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

/** Enllaços de la capçalera (pantalles grans). */
export function TopNav() {
  const pathname = usePathname();
  return (
    <div className="hidden items-center gap-1 sm:flex">
      {ITEMS.filter((i) => i.desktop).map(({ href, label }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cx(
              "display relative rounded-md px-3 py-2 text-base tracking-wide text-brand-fg/80 hover:text-brand-fg",
              active && "text-brand-fg after:absolute after:inset-x-3 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-[#e0b36e]",
            )}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}

/** Barra inferior amb icones (mòbil), com una app nativa. */
export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Navegació principal"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden"
    >
      <ul className="grid grid-cols-4">
        {ITEMS.map(({ href, label, Icon }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cx("flex flex-col items-center gap-0.5 pt-2 pb-1.5 text-[11px] font-medium", active ? "text-accent" : "text-muted")}
              >
                <span className={cx("grid h-7 w-12 place-items-center rounded-full transition", active && "bg-accent-soft")}>
                  <Icon className="h-5 w-5" />
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
