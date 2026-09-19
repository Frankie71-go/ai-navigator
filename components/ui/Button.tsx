import { Link } from "react-router-dom";
import { clsx } from "@/lib/clsx";

type Variant = "primary" | "secondary" | "ghost";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-gradient-to-r from-accent to-accent2 bg-[length:200%_auto] text-white font-semibold shadow-neon hover:shadow-neon-warm hover:brightness-105 hover:bg-right transition-all",
  secondary:
    "border border-line bg-panel text-ink hover:border-accent/60 hover:text-accent",
  ghost: "text-muted hover:bg-ink/5 hover:text-accent",
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm transition-all duration-200 disabled:opacity-50",
        VARIANTS[variant],
        className
      )}
      {...props}
    />
  );
}

interface LinkButtonProps {
  href: string;
  variant?: Variant;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}

export function LinkButton({
  href,
  variant = "primary",
  className,
  children,
  onClick,
}: LinkButtonProps) {
  return (
    <Link
      to={href}
      onClick={onClick}
      className={clsx(
        "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm transition-all duration-200",
        VARIANTS[variant],
        className
      )}
    >
      {children}
    </Link>
  );
}
