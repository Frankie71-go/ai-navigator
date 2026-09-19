import { clsx } from "@/lib/clsx";

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  className,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <div className={clsx("mb-6", className)}>
      {eyebrow && (
        <div className="mb-2 font-mono text-xs tracking-widest text-accent">
          {eyebrow}
        </div>
      )}
      <h1 className="text-2xl font-semibold text-gradient-neon">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
    </div>
  );
}
