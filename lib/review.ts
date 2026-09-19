// 内容审查机制：按必填字段校验每场比赛的信息完整度。
// 必填字段对应需求：项目名称 / 时间 / 类型 / 方向 / 人群 / 官网链接 / 报名链接。
// 纯函数，供比赛卡片、详情页、审查台共用，不依赖数据库。

import type { Competition } from "@/lib/types";
import { REVIEW_REQUIRED_FIELDS } from "@/lib/types";

/** 字段中文标签（用于审查台展示缺失项） */
export const REVIEW_FIELD_LABELS: Record<string, string> = {
  name: "项目名称",
  time: "时间",
  category: "类型",
  aiDirection: "方向",
  suitableFor: "人群",
  officialUrl: "官网链接",
  registrationUrl: "报名链接",
};

export interface ReviewResult {
  /** 缺失的必填字段 key 列表 */
  missingKeys: string[];
  /** 缺失字段中文标签 */
  missingLabels: string[];
  /** 信息完整度 0-100 */
  completeness: number;
  /** 是否全部必填项已填 */
  complete: boolean;
  /** 各字段是否填写 */
  fieldStatus: Record<string, boolean>;
}

function isFilled(value: unknown): boolean {
  if (value == null) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

export function reviewCompetition(c: Competition): ReviewResult {
  const fieldStatus: Record<string, boolean> = {};
  const record = c as unknown as Record<string, unknown>;
  for (const key of REVIEW_REQUIRED_FIELDS) {
    fieldStatus[key] = isFilled(record[key]);
  }

  const missingKeys = REVIEW_REQUIRED_FIELDS.filter((k) => !fieldStatus[k]);
  const missingLabels = missingKeys.map((k) => REVIEW_FIELD_LABELS[k] ?? k);
  const total = REVIEW_REQUIRED_FIELDS.length;
  const completeness = Math.round(
    ((total - missingKeys.length) / total) * 100
  );

  return {
    missingKeys,
    missingLabels,
    completeness,
    complete: missingKeys.length === 0,
    fieldStatus,
  };
}
