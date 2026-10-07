import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import type { Semafor } from "@/lib/calc";

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

export function PageHeader({ title, subtitle, back, actions }: { title: ReactNode; subtitle?: ReactNode; back?: { href: string; label: string }; actions?: ReactNode }) {
  return (
    <header className="mb-5">
      {back && (
        <Link href={back.href} className="mb-2 inline-block text-sm text-muted hover:text-foreground">
          ← {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="display text-3xl leading-tight text-heading sm:text-4xl">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </header>
  );
}

export function Card({ title, actions, children, className }: { title?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cx("min-w-0 rounded-2xl border border-border bg-surface p-4 shadow-[0_1px_2px_rgba(11,27,77,0.06)] sm:p-5", className)}>
      {(title || actions) && (
        <div className="mb-3 flex items-center justify-between gap-2">
          {title && <h2 className="display text-lg text-heading">{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

const buttonStyles = {
  primary: "bg-accent text-accent-fg hover:opacity-90",
  secondary: "border-2 border-accent text-accent bg-surface hover:bg-accent-soft",
  danger: "border-2 border-danger/50 text-danger hover:bg-danger-soft",
  ghost: "text-accent hover:bg-accent-soft",
};

export type ButtonVariant = keyof typeof buttonStyles;

export function buttonClass(variant: ButtonVariant = "primary", size: "md" | "sm" = "md") {
  return cx(
    // Botons "píndola" en majúscules, com a la web del club
    "display inline-flex items-center justify-center gap-1.5 rounded-full transition disabled:opacity-50",
    size === "md" ? "min-h-11 px-5 text-[15px]" : "min-h-9 px-4 text-sm",
    buttonStyles[variant],
  );
}

export function Button({ variant = "primary", size = "md", className, ...props }: ComponentProps<"button"> & { variant?: ButtonVariant; size?: "md" | "sm" }) {
  return <button className={cx(buttonClass(variant, size), className)} {...props} />;
}

export function LinkButton({ variant = "primary", size = "md", className, ...props }: ComponentProps<typeof Link> & { variant?: ButtonVariant; size?: "md" | "sm" }) {
  return <Link className={cx(buttonClass(variant, size), className)} {...props} />;
}

export function Field({ label, hint, children, className }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={cx("block", className)}>
      <span className="mb-1 block text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

export function Input(props: ComponentProps<"input">) {
  return <input {...props} className={cx("input", props.className)} />;
}

export function Textarea(props: ComponentProps<"textarea">) {
  return <textarea {...props} className={cx("input", props.className)} />;
}

export function Select({ options, placeholder, ...props }: ComponentProps<"select"> & { options: readonly { value: string; label: string }[]; placeholder?: string }) {
  return (
    <select {...props} className={cx("input", props.className)}>
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function Badge({ tone = "neutral", children }: { tone?: "neutral" | "ok" | "warn" | "danger" | "accent"; children: ReactNode }) {
  const tones = {
    neutral: "bg-surface-2 text-muted",
    ok: "bg-ok-soft text-ok",
    warn: "bg-warn-soft text-warn",
    danger: "bg-danger-soft text-danger",
    accent: "bg-accent-soft text-accent",
  };
  return <span className={cx("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", tones[tone])}>{children}</span>;
}

const SEMAFOR = {
  verd: { tone: "ok", icon: "●", label: "Bé" },
  groc: { tone: "warn", icon: "▲", label: "Atenció" },
  vermell: { tone: "danger", icon: "■", label: "Alerta" },
  sense: { tone: "neutral", icon: "○", label: "Sense wellness" },
} as const;

/** Estat del wellness amb icona + text (mai només color). */
export function SemaforBadge({ status }: { status: Semafor }) {
  const s = SEMAFOR[status];
  return (
    <Badge tone={s.tone}>
      <span aria-hidden>{s.icon}</span>
      {s.label}
    </Badge>
  );
}

export function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="rounded-xl bg-surface-2 p-3">
      <div className="text-xs text-muted">{label}</div>
      <div className="display mt-0.5 text-2xl text-heading tabular-nums">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-muted">{sub}</div>}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted">{children}</p>;
}
