"use client";

import { clsx } from "@/lib/clsx";

/**
 * 多选胶囊按钮组：用于技能 / 人格 / 目的 / AI 方向等可多选标签。
 * 从 ProfileForm 抽出为共享组件，投稿表单与画像表单复用同一套视觉。
 */
export function MultiToggle({
  options,
  selected,
  onToggle,
  size = "sm",
}: {
  options: readonly string[];
  selected: string[];
  onToggle: (v: string) => void;
  size?: "sm" | "md";
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = selected.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onToggle(opt)}
            className={clsx(
              "rounded-full border px-3 py-1 font-mono transition-colors",
              size === "sm" ? "text-xs" : "text-sm",
              active
                ? "border-accent/60 bg-accent-soft text-accent shadow-neon"
                : "border-line text-muted hover:text-ink"
            )}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}
