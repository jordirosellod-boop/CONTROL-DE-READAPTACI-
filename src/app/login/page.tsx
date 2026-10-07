import type { Metadata } from "next";
import Image from "next/image";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Accés" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams;
  return (
    <main className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <Image src="/escut.png" alt="Escut del club" width={96} height={96} priority className="mx-auto mb-4 h-24 w-24 object-contain" />
          <h1 className="text-2xl font-semibold">Control de Readaptació</h1>
          <p className="mt-1 text-sm text-muted">Accés exclusiu per a l&apos;equip de readaptació</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-5">
          <LoginForm next={typeof next === "string" ? next : ""} />
        </div>
      </div>
    </main>
  );
}
