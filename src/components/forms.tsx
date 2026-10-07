"use client";

import { createContext, use, useActionState, useState, useTransition, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Button, cx, type ButtonVariant } from "./ui";
import type { FormState } from "@/lib/form";

type Action = (prev: FormState, formData: FormData) => Promise<FormState>;

const PendingContext = createContext<boolean | null>(null);

/**
 * Formulari amb estat: mostra errors i missatges d'èxit retornats per l'acció.
 * S'envia via onSubmit (i no amb la prop `action`) perquè React no buidi els
 * camps quan hi ha un error; només es reinicia si `resetOnSuccess`.
 */
export function ActionForm({ action, children, className, resetOnSuccess }: { action: Action; children: ReactNode; className?: string; resetOnSuccess?: boolean }) {
  const [state, formAction] = useActionState(action, undefined);
  const [pending, startTransition] = useTransition();
  return (
    <form
      className={cx("space-y-4", className)}
      key={resetOnSuccess && state?.ok ? state.ts : undefined}
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => formAction(fd));
      }}
    >
      {state?.error && (
        <p role="alert" className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p role="status" className="rounded-xl bg-ok-soft px-3 py-2 text-sm text-ok">
          {state.ok}
        </p>
      )}
      <PendingContext value={pending}>{children}</PendingContext>
    </form>
  );
}

export function SubmitButton({ children, variant = "primary", className, size }: { children: ReactNode; variant?: ButtonVariant; className?: string; size?: "md" | "sm" }) {
  const ctxPending = use(PendingContext);
  const { pending: statusPending } = useFormStatus();
  const pending = ctxPending ?? statusPending;
  return (
    <Button type="submit" variant={variant} size={size} disabled={pending} className={className}>
      {pending ? "Desant…" : children}
    </Button>
  );
}

/** Botó d'acció directa (eliminar, duplicar...) amb confirmació opcional. */
export function ActionButton({
  action,
  children,
  confirm,
  variant = "secondary",
  size = "sm",
}: {
  action: () => Promise<unknown>;
  children: ReactNode;
  confirm?: string;
  variant?: ButtonVariant;
  size?: "md" | "sm";
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <span className="inline-flex flex-col">
      <Button
        type="button"
        variant={variant}
        size={size}
        disabled={pending}
        onClick={async () => {
          if (confirm && !window.confirm(confirm)) return;
          setPending(true);
          setError(null);
          try {
            const res = (await action()) as FormState;
            if (res?.error) setError(res.error);
          } finally {
            setPending(false);
          }
        }}
      >
        {pending ? "…" : children}
      </Button>
      {error && <span className="mt-1 text-xs text-danger">{error}</span>}
    </span>
  );
}

/** Escala de botons grans (1–5, 0–10...) amb etiquetes als extrems. */
export function ScaleInput({ name, min, max, defaultValue, low, high, invert, required = true }: { name: string; min: number; max: number; defaultValue?: number | null; low?: string; high?: string; invert?: boolean; required?: boolean }) {
  const [value, setValue] = useState<number | null>(defaultValue ?? null);
  const values = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  const tone = (v: number) => {
    // posició relativa: 0 = pitjor, 1 = millor
    const r = (v - min) / (max - min);
    const good = invert ? 1 - r : r;
    if (good >= 0.7) return "bg-ok text-surface";
    if (good >= 0.4) return "bg-warn text-surface";
    return "bg-danger text-surface";
  };
  return (
    <div>
      <div className="flex gap-1.5">
        {values.map((v) => (
          <label key={v} className="flex-1">
            <input type="radio" name={name} value={v} required={required} checked={value === v} onChange={() => setValue(v)} className="peer sr-only" />
            <span
              className={cx(
                "flex h-11 cursor-pointer items-center justify-center rounded-lg border text-sm font-semibold tabular-nums transition peer-focus-visible:outline-2 peer-focus-visible:outline-accent",
                value === v ? cx(tone(v), "border-transparent") : "border-border bg-surface hover:bg-surface-2",
              )}
            >
              {v}
            </span>
          </label>
        ))}
      </div>
      {(low || high) && (
        <div className="mt-1 flex justify-between text-xs text-muted">
          <span>{low}</span>
          <span>{high}</span>
        </div>
      )}
    </div>
  );
}

/** Selecció múltiple de zones del cos en forma de xips. */
export function ChipMultiSelect({ name, options, defaultValue = [] }: { name: string; options: { value: string; label: string; grup: string }[]; defaultValue?: string[] }) {
  const [selected, setSelected] = useState<string[]>(defaultValue);
  const groups = [...new Set(options.map((o) => o.grup))];
  return (
    <div className="space-y-2">
      {groups.map((g) => (
        <div key={g}>
          <div className="mb-1 text-xs text-muted">{g}</div>
          <div className="flex flex-wrap gap-1.5">
            {options
              .filter((o) => o.grup === g)
              .map((o) => {
                const on = selected.includes(o.value);
                return (
                  <label key={o.value}>
                    <input
                      type="checkbox"
                      name={name}
                      value={o.value}
                      checked={on}
                      onChange={() => setSelected((s) => (on ? s.filter((x) => x !== o.value) : [...s, o.value]))}
                      className="peer sr-only"
                    />
                    <span className={cx("inline-block cursor-pointer rounded-full border px-3 py-1.5 text-sm transition peer-focus-visible:outline-2 peer-focus-visible:outline-accent", on ? "border-accent bg-accent-soft text-accent" : "border-border hover:bg-surface-2")}>
                      {o.label}
                    </span>
                  </label>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
}
