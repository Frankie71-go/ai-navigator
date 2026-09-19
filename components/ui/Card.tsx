import { clsx } from "@/lib/clsx";

export function Card({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        "group relative rounded-card border border-[rgba(15,27,61,0.08)] bg-white/70 backdrop-blur-xl shadow-glass",
        "transition-all duration-300 hover:-translate-y-1 hover:border-accent/30 hover:shadow-elevate",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
