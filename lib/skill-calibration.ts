// skill-calibration.ts
// ============================================================================
// 技能自评的客观校准机制
// ----------------------------------------------------------------------------
// 问题：画像里的「技能评分」(skillRatings) 是纯手自评 (1-5)，可能偏主观
//       —— 自评虚高会把不擅长方向的比赛推上来，自评虚低会漏判真实能力。
//
// 思路：用匿名本地行为（浏览 / 点击 / 收藏 / 搜索）反推对四个技能维度的
//       *实际投入*，作为「行为信号」，再与自评分按证据量融合：
//        - 行为证据越少 → 越信任自评分（不冤枉没数据的用户，保守）；
//        - 行为证据越多 → 越偏向行为信号（抑制纯自评的虚高 / 虚低）。
//
// 融合规则（安全边界）：
//  校准分 = (1-conf) * self + conf * signal        // 信号≥自评：向上全强度
//  校准分 = (1-conf) * self + conf * signal * 0.5  // 信号< 自评：向下半强度
//  => 自评虚低 (self=0 但常看某类比赛) → 校准分升高，修复漏判；
//  => 自评虚高 (self=5 但零行为)       → 保持 5，无证据不强行下调。
//
// 注意：本模块只影响「智能推荐」里的技能维度，队友匹配本身不读技能分。
// ============================================================================

import type { UserProfile, Competition, SkillKey } from "@/lib/types";
import { getLocalBehaviors, type LocalBehavior } from "@/lib/cloudbase/db";
import { SKILL_MAP, skillToDimensions } from "@/lib/recommend/recommendation";

export const SKILL_DIMS: SkillKey[] = ["Coding", "Research", "Product", "Presentation"];

// 行为类型 → 权重（收藏最具意图强度）
const ACTION_WEIGHT: Record<string, number> = {
  view: 1,
  click: 1.5,
  save: 2,
  search: 1,
};

// 证据量封顶：加权证据达到该值即「完全采用行为信号」(conf=1)
const EVIDENCE_FULL = 4;
// 行为信号归一化：加权证据 / SIGNAL_NORM 映射到 0..5（约几场相关比赛即满信号）
const SIGNAL_NORM = 3;

export interface DimensionSignal {
  evidence: number; // 加权证据量
  signal: number; // 0-5 行为信号分
}

/**
 * 从匿名行为反推四个技能维度的行为信号。
 * @returns 每个维度的 { evidence, signal }
 */
export function deriveDimensionSignals(
  behaviors: LocalBehavior[],
  competitions: Competition[]
): Record<SkillKey, DimensionSignal> {
  const compById = new Map(competitions.map((c) => [c.id, c]));
  const weighted: Record<SkillKey, number> = {
    Coding: 0,
    Research: 0,
    Product: 0,
    Presentation: 0,
  };

  for (const b of behaviors) {
    // 比赛相关行为：累加该比赛 skills 命中维度的权重
    if ((b.type === "view" || b.type === "click" || b.type === "save") && b.competitionId) {
      const c = compById.get(b.competitionId);
      const w = ACTION_WEIGHT[b.type] ?? 0;
      if (c && c.skills?.length) {
        const dims = new Set<SkillKey>();
        for (const sk of c.skills) {
          for (const d of skillToDimensions(sk) as SkillKey[]) dims.add(d);
        }
        for (const d of dims) weighted[d] += w;
      }
    }
    // 搜索行为：关键词命中某维度关键字 → 计入该维度
    if (b.type === "search" && b.metadata?.keyword) {
      const kw = String(b.metadata.keyword).toLowerCase();
      for (const d of SKILL_DIMS) {
        const hit = (SKILL_MAP[d] as readonly string[]).some((k) =>
          kw.includes(k.toLowerCase())
        );
        if (hit) weighted[d] += ACTION_WEIGHT.search;
      }
    }
  }

  const out = {} as Record<SkillKey, DimensionSignal>;
  for (const d of SKILL_DIMS) {
    const evidence = weighted[d];
    const signal = Math.min(5, (evidence / SIGNAL_NORM) * 5);
    out[d] = { evidence, signal: Math.round(signal) };
  }
  return out;
}

/**
 * 融合自评分与行为信号，返回校准后的 skillRatings（维度结构不变，0-5 整数）。
 * 无行为数据或 competitions 为空时退化为原自评，保证无回归。
 */
export function calibrateSkillRatings(
  profile: UserProfile,
  competitions: Competition[],
  behaviors: LocalBehavior[] = getLocalBehaviors()
): Record<SkillKey, number> {
  const self: Record<SkillKey, number> = {
    Coding: profile.skillRatings?.Coding ?? 0,
    Research: profile.skillRatings?.Research ?? 0,
    Product: profile.skillRatings?.Product ?? 0,
    Presentation: profile.skillRatings?.Presentation ?? 0,
  };
  const signals = deriveDimensionSignals(behaviors, competitions);

  const out = {} as Record<SkillKey, number>;
  for (const d of SKILL_DIMS) {
    const s = self[d];
    const signal = signals[d].signal;
    const conf = Math.min(1, signals[d].evidence / EVIDENCE_FULL);

    let raw: number;
    if (signal >= s) {
      // 向上全强度：证据足以支撑更高评分（修复自评虚低）
      raw = (1 - conf) * s + conf * signal;
    } else {
      // 向下半强度：只温和下调（安全边界，避免无证据时误伤）
      raw = (1 - conf) * s + conf * signal * 0.5;
    }
    out[d] = Math.max(0, Math.min(5, Math.round(raw)));
  }
  return out;
}

/** 是否存在可用的校准证据（供 UI 提示用） */
export function hasCalibrationEvidence(
  competitions: Competition[],
  behaviors: LocalBehavior[] = getLocalBehaviors()
): boolean {
  const signals = deriveDimensionSignals(behaviors, competitions);
  return SKILL_DIMS.some((d) => signals[d].evidence >= 1);
}
