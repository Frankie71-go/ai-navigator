import { clsx } from "@/lib/clsx";

type Tone = "default" | "accent" | "outline" | "pink";

const TONES: Record<Tone, string> = {
  // 中性石板芯片：安静退后，让彩色标签（AI 方向）成为视觉主角
  default: "border border-slate-400/30 bg-slate-500/10 text-slate-700",
  accent: "border border-accent/40 bg-accent-soft text-accent",
  pink: "border border-accent2/40 bg-accent2/10 text-accent2",
  outline: "border border-slate-400/40 text-slate-600",
};

export function Tag({
  tone = "default",
  color,
  className,
  children,
}: {
  tone?: Tone;
  /** 传入即用此配色（覆盖 tone），用于彩色标签 */
  color?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 font-mono text-[11px] font-medium tracking-wide",
        color ?? TONES[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
