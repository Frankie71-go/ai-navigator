// 报名状态判定：基于报名截止日，计算「正在报名 / 即将截止 / 报名已截止」。
// 供首页、比赛卡片、详情页共用，保证全站状态口径一致。
// 注意：静态导出时该计算在「构建期」求值（首页/详情为服务端组件），
// 列表页为客户端组件在浏览器访问时求值；二者在同一天内无差异。

import type { Competition } from "@/lib/types";

export type RegStatus = "open" | "soon" | "closed";

export interface RegStatusInfo {
  status: RegStatus;
  label: string;
  /** 直接用于徽章的 Tailwind 颜色类 */
  className: string;
}

/** 距截止 ≤ 该天数视为「即将截止」 */
export const SOON_THRESHOLD_DAYS = 7;

export function getRegStatus(
  c: Competition,
  today: Date = new Date()
): RegStatusInfo {
  // 截止日按当天 23:59:59 计算，避免时区边界误判
  const deadline = new Date(`${c.deadline}T23:59:59`);
  const diffDays = Math.ceil(
    (deadline.getTime() - today.getTime()) / 86_400_000
  );

  if (diffDays < 0) {
    return {
      status: "closed",
      label: "报名已截止",
      className: "bg-line/50 text-muted",
    };
  }
  if (diffDays <= SOON_THRESHOLD_DAYS) {
    return {
      status: "soon",
      label: `即将截止 · ${c.deadline}`,
      className: "border border-accent2/50 bg-accent2/10 text-accent2",
    };
  }
  return {
    status: "open",
    label: "正在报名",
    className: "border border-accent/40 bg-accent-soft text-accent",
  };
}
