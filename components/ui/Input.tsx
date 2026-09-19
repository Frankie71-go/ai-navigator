import { clsx } from "@/lib/clsx";

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={clsx(
        "w-full rounded-md border border-line bg-panel px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-muted focus:border-accent focus:shadow-neon",
        className
      )}
      {...props}
    />
  );
}

export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={clsx(
        "rounded-md border border-line bg-panel px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-accent focus:shadow-neon",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={clsx(
        "w-full rounded-md border border-line bg-panel px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-muted focus:border-accent focus:shadow-neon",
        className
      )}
      {...props}
    />
  );
}
