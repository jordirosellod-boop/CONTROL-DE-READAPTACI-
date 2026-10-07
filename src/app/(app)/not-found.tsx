import { LinkButton } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md py-12 text-center">
      <h1 className="text-xl font-semibold">No s&apos;ha trobat</h1>
      <p className="mt-2 text-sm text-muted">Aquest registre no existeix o no hi tens accés.</p>
      <LinkButton href="/" className="mt-4">
        Tornar al panell
      </LinkButton>
    </div>
  );
}
