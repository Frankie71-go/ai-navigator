// skill-verify.ts
// ============================================================================
// AI Navigator · 技能「经历验证 / AI 审查」模块
// ----------------------------------------------------------------------------
// 职责：用用户填写的「既往项目经历」作为客观证据，逐维度验证其技能自评
//       (skillRatings) 是否站得住脚，输出判定 + 理由 + 整体可信度。
//
// ⚠️ 与 lib/recommend/explain.ts 同构的接口设计（已接 LLM 的关键）：
//   `verifySkills(profile): Promise<VerificationReport>` 是唯一对外接口。
//   优先委托 `verifySkillsLLM`：通过腾讯云云开发云函数「ai-verify」代理调用
//   大模型，真实 key 只存在云函数环境变量，浏览器永不接触。
//   未配置 CloudBase 或调用失败时自动回退 `verifySkillsLocal`（纯规则、离线、零成本）。
//   页面层、类型全部零改动——切换引擎只是 verifySkills 内部的 if 分支。
// ============================================================================

import type { SkillKey, UserProfile } from "@/lib/types";
import { SKILL_LABELS } from "@/lib/data/taxonomy";
import { callTcbFunction } from "@/lib/cloudbase/client";

export const SKILL_DIMS: SkillKey[] = ["Coding", "Research", "Product", "Presentation"];

/** 单维度判定 */
export type Verdict =
  | "verified" // 经历充分支撑自评
  | "partial" // 自评低于经历（潜力未被体现）
  | "unverified" // 有自评但零经历支撑
  | "overclaimed" // 自评高于经历（疑似高估）
  | "no_self"; // 未自评，无需验证

export interface SkillVerdict {
  dim: SkillKey;
  label: string;
  self: number; // 自评分 0-5
  expectation: number; // 经历推导期望分 0-5
  verdict: Verdict;
  reason: string;
}

export interface VerificationReport {
  perSkill: SkillVerdict[];
  overall: string; // 整体叙述（AI 风格）
  confidence: number; // 0-1：经历越多越可信
  hasEvidence: boolean;
  engine?: "cloud" | "local"; // 本次审查由云端大模型还是本地规则产出
}

// 期望分映射：经历段数 → 基础期望
const EXP_TO_EXPECTATION = [0, 2, 3, 4]; // 0段→0, 1段→2, 2段→3, 3+段→4
const OUTCOME_BOOST = 1; // 有获奖/发表/上线 再 +1（封顶 5）

/** 把经历段数换算为期望分（含成果加成） */
function expectationFromExperiences(count: number, hasOutcome: boolean): number {
  const base = EXP_TO_EXPECTATION[Math.min(count, EXP_TO_EXPECTATION.length - 1)];
  return Math.min(5, base + (hasOutcome ? OUTCOME_BOOST : 0));
}

/** 单维度：对比 self 与期望，产出 verdict + reason */
function judgeOne(dim: SkillKey, self: number, expCount: number, hasOutcome: boolean): SkillVerdict {
  const label = SKILL_LABELS[dim] ?? dim;
  const expectation = expectationFromExperiences(expCount, hasOutcome);

  if (self <= 0) {
    return {
      dim,
      label,
      self,
      expectation,
      verdict: "no_self",
      reason: expCount > 0
        ? `你有 ${expCount} 段相关经历却未自评该技能，建议在画像中补上。`
        : "尚未自评该技能，填写经历后可启用验证。",
    };
  }

  if (expCount === 0) {
    return {
      dim,
      label,
      self,
      expectation,
      verdict: "unverified",
      reason: `自评 ${self}/5，但没有相关项目经历支撑，建议补充经历或先保守使用该分。`,
    };
  }

  const gap = self - expectation;
  if (gap <= 1 && gap >= -1) {
    return {
      dim,
      label,
      self,
      expectation,
      verdict: "verified",
      reason: `有 ${expCount} 段相关经历${hasOutcome ? "（含成果）" : ""}，支撑自评 ${self}/5，验证通过。`,
    };
  }
  if (gap > 1) {
    return {
      dim,
      label,
      self,
      expectation,
      verdict: "overclaimed",
      reason: `自评 ${self}/5，但 ${expCount} 段经历仅支撑约 ${expectation}/5，建议下调以匹配实际投入。`,
    };
  }
  // gap < -1：自评低于经历
  return {
    dim,
    label,
    self,
    expectation,
    verdict: "partial",
    reason: `自评 ${self}/5，但 ${expCount} 段经历显示可达约 ${expectation}/5，你的能力可能被低估。`,
  };
}

/** 本地规则实现（当前版本） */
function verifySkillsLocal(profile: UserProfile): VerificationReport {
  const exps = profile.experiences ?? [];
  const self: Record<SkillKey, number> = profile.skillRatings ?? {
    Coding: 0, Research: 0, Product: 0, Presentation: 0,
  };

  const perSkill = SKILL_DIMS.map((dim) => {
    const related = exps.filter((e) => (e.skillsUsed ?? []).includes(dim));
    const hasOutcome = related.some((e) => !!e.outcome && e.outcome.trim().length > 0);
    return judgeOne(dim, self[dim] ?? 0, related.length, hasOutcome);
  });

  const withEvidence = exps.length > 0;
  const claimed = perSkill.filter((s) => s.self > 0);
  const verified = perSkill.filter((s) => s.verdict === "verified").length;
  const overclaimed = perSkill.filter((s) => s.verdict === "overclaimed").length;
  const unverified = perSkill.filter((s) => s.verdict === "unverified").length;

  // 可信度：随经历数上升，且有自评被验证时更高
  const confidence = withEvidence
    ? Math.min(1, 0.3 + exps.length * 0.18 + verified * 0.05)
    : 0;

  let overall: string;
  if (!withEvidence) {
    overall = "尚未填写任何项目经历，技能仍为纯自评，无法验证。补全经历后 AI 审查会自动启用。";
  } else if (claimed.length === 0) {
    overall = `已记录 ${exps.length} 段经历，但你还没有自评任何技能维度，建议回到上方补全技能评分。`;
  } else if (overclaimed > 0) {
    overall = `AI 审查发现 ${overclaimed} 项技能自评高于经历支撑，建议按提示微调，让队友匹配更准。`;
  } else if (unverified > 0 && verified === 0) {
    overall = `已记录 ${exps.length} 段经历，但当前自评均缺少直接证据，补充对应方向的经历可提升可信度。`;
  } else {
    overall = `基于 ${exps.length} 段经历，你的技能画像整体通过 AI 验证（${verified}/${claimed.length} 项已验证）。`;
  }

  return { perSkill, overall, confidence, hasEvidence: withEvidence, engine: "local" };
}

export async function verifySkills(profile: UserProfile): Promise<VerificationReport> {
  const llm = await verifySkillsLLM(profile);
  if (llm) return llm;
  return verifySkillsLocal(profile);
}

// —— 真实大模型实现（经腾讯云云开发云函数「ai-verify」代理）——
// 浏览器只与本项目云函数通信，真实 key 只存在于云函数环境变量，
// 绝不会打进前端包。
// 未配置 CloudBase / 函数未部署 / 调用异常 → 返回 null，
// 由 verifySkills 回退到本地规则，页面不会中断。
async function verifySkillsLLM(profile: UserProfile): Promise<VerificationReport | null> {
  const res = await callTcbFunction("ai-verify", { profile });
  if (!res || !Array.isArray(res.perSkill)) {
    console.warn("[verify] cloud function unavailable or bad shape, fallback local");
    return null;
  }
  // 云函数已返回结构化的 VerificationReport
  return { ...(res as VerificationReport), engine: "cloud" } as VerificationReport;
}

/**
 * 把审查结果折算为「有效技能分」：供队友匹配的互补计算使用。
 * - verified / partial：保留自评（partial 视为潜力，保留）。
 * - unverified：视为不确定，压到期望(0) 不计入强项。
 * - overclaimed：封顶到经历期望分。
 * - no_self：保持 0。
 */
export function effectiveSkillRatings(profile: UserProfile): Record<SkillKey, number> {
  const report = verifySkillsLocal(profile);
  const self: Record<SkillKey, number> = profile.skillRatings ?? {
    Coding: 0, Research: 0, Product: 0, Presentation: 0,
  };
  const out = {} as Record<SkillKey, number>;
  for (const v of report.perSkill) {
    switch (v.verdict) {
      case "overclaimed":
        out[v.dim] = v.expectation;
        break;
      case "unverified":
        out[v.dim] = 0;
        break;
      default:
        out[v.dim] = self[v.dim] ?? 0;
    }
  }
  return out;
}
