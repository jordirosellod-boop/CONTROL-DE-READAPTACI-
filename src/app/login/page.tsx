import type { Metadata } from "next";
import Image from "next/image";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Accés" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams;
  return (
    <main className="grid min-h-screen place-items-center bg-gradient-to-b from-brand to-navy px-4 py-10 text-brand-fg">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <Image src="/escut.png" alt="Escut CE Europa" width={112} height={112} priority className="mx-auto mb-4 h-28 w-28 object-contain drop-shadow-lg" />
          <p className="display text-lg text-[#e0b36e]">CE Europa</p>
          <h1 className="display text-4xl leading-none">Control de Readaptació</h1>
          <p className="mt-2 text-sm text-brand-fg/80">Accés exclusiu per a l&apos;equip de readaptació</p>
        </div>
        <div className="rounded-2xl bg-surface p-5 text-foreground shadow-xl">
          <LoginForm next={typeof next === "string" ? next : ""} />
        </div>
      </div>
    </main>
  );
}
