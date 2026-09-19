import { getRegStatus } from "@/lib/registration";
import type { Competition } from "@/lib/types";

// 报名状态徽章：点 + 文案。颜色由 getRegStatus 统一给出，服务端 / 客户端组件均可使用。
export function StatusBadge({
  c,
  today,
}: {
  c: Competition;
  today?: Date;
}) {
  const info = getRegStatus(c, today);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${info.className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {info.label}
    </span>
  );
}
