// 队友匹配：
//  - 默认模式：基于「人格特质 + 参赛目的 + 技能互补」找相似队友（同温层）。
//  - 比赛模式（competitionId 传入）：先看中一个比赛，再在「同样想参加该比赛」的
//    同学里找队友，按「技能互补 + 人格契合 + AI 方向一致」排序。
// 两种模式都依赖"人"的契合度，只是比赛模式先锁定共同目标（比赛）再排人。

import type { UserProfile, SkillKey } from "@/lib/types";
import type { Teammate } from "@/lib/teammates";
import { effectiveSkillRatings, SKILL_DIMS } from "@/lib/skill-verify";
import { SKILL_LABELS } from "@/lib/data/taxonomy";
import { competitions } from "@/lib/data/competitions";

const COMP_NAME = new Map(competitions.map((c) => [c.id, c.name]));

export interface TeammateMatch {
  teammate: Teammate;
  score: number; // 0-100
  reasons: string[];
}

function overlap<T>(a: T[], b: T[]): T[] {
  const set = new Set(b);
  return a.filter((x) => set.has(x));
}

function complementOf(profile: UserProfile, t: Teammate): {
  score: number;
  gapFilled: SkillKey[];
} {
  const eff = effectiveSkillRatings(profile);
  const userCovered = SKILL_DIMS.filter((d) => (eff[d] ?? 0) >= 3);
  const hasUserSkill = userCovered.length > 0;
  const teammateSkills = t.skills ?? [];
  const gapFilled = teammateSkills.filter((d) => !userCovered.includes(d));
  const score =
    hasUserSkill && teammateSkills.length > 0
      ? gapFilled.length / teammateSkills.length
      : 0;
  return { score, gapFilled };
}

/**
 * 默认模式评分：参赛目的 40% + 人格特质 35% + 技能互补 25%。
 */
function scoreGeneral(profile: UserProfile, t: Teammate): { score: number; reasons: string[] } {
  const userGoals = profile.goals ?? [];
  const userPersonality = profile.personality ?? [];

  const sharedGoals = overlap(userGoals, t.goals);
  const sharedPersonality = overlap(userPersonality, t.personality);

  const goalScore = userGoals.length > 0 ? sharedGoals.length / userGoals.length : 0;
  const personalityScore =
    userPersonality.length > 0 ? sharedPersonality.length / userPersonality.length : 0;

  const { score: complementScore, gapFilled } = complementOf(profile, t);
  const hasUserSkill = (profile.skillRatings
    ? Object.values(profile.skillRatings).some((v) => v > 0)
    : false) || (profile.experiences?.length ?? 0) > 0;

  const bothEmpty =
    userGoals.length === 0 && userPersonality.length === 0 && !hasUserSkill;
  const base = bothEmpty ? 0.4 : 0;

  const raw = base + goalScore * 0.4 + personalityScore * 0.35 + complementScore * 0.25;
  const score = Math.round(Math.min(100, Math.max(0, raw * 100)));

  const reasons: string[] = [];
  if (sharedGoals.length) reasons.push(`参赛目的相近：${sharedGoals.join("、")}`);
  if (sharedPersonality.length) reasons.push(`人格特质相似：${sharedPersonality.join("、")}`);
  if (profile.identity && profile.identity === t.identity)
    reasons.push(`同为${t.identity}，节奏更好对齐`);
  if (profile.major && profile.major === t.major)
    reasons.push(`同专业（${t.major}），沟通成本低`);
  if (gapFilled.length)
    reasons.push(
      `技能互补：TA 的 ${gapFilled.map((d) => SKILL_LABELS[d] ?? d).join("、")} 可补你当前短板`
    );
  if (reasons.length === 0)
    reasons.push("画像信息较少，建议补全「参赛目的 / 人格特质 / 项目经历」以提升匹配精度");
  return { score, reasons };
}

/**
 * 比赛模式评分：在「同样想参加该比赛」的同学里，按
 * 技能互补 50% + 人格契合 50% 排序（比赛已是共同目标，不再计入）。
 * 注：UserProfile 现已采集 aiDirection（与画像共享），但比赛模式以「共同目标 + 互补」
 * 为核心，该维度暂不计入分数，仅作为未来增强的可用信号。
 */
function scoreForCompetition(
  profile: UserProfile,
  t: Teammate,
  competitionId: string
): { score: number; reasons: string[] } {
  const compName = COMP_NAME.get(competitionId) ?? competitionId;
  const userPersonality = profile.personality ?? [];

  const sharedPersonality = overlap(userPersonality, t.personality);
  const personalityScore =
    userPersonality.length > 0 ? sharedPersonality.length / userPersonality.length : 0;

  const { score: complementScore, gapFilled } = complementOf(profile, t);

  const raw = complementScore * 0.5 + personalityScore * 0.5;
  const score = Math.round(Math.min(100, Math.max(0, raw * 100)));

  const reasons: string[] = [`都瞄准《${compName}》，目标一致`];
  if (gapFilled.length)
    reasons.push(
      `技能互补：TA 的 ${gapFilled.map((d) => SKILL_LABELS[d] ?? d).join("、")} 可补你短板`
    );
  if (sharedPersonality.length) reasons.push(`人格契合：${sharedPersonality.join("、")}`);
  return { score, reasons };
}

/**
 * 返回按匹配度降序排列的队友（含分数与理由）。
 * @param candidates 候选池，默认内置演示队友；接投稿后传入 mock + 用户投稿
 * @param excludeOwnerId 投稿者匿名 ID，传入后过滤掉本人，避免「自己匹配自己」
 * @param competitionId 传入后切换为「比赛模式」：仅保留同样想参加该比赛的队友
 */
export function matchTeammates(
  profile: UserProfile,
  candidates: Teammate[] = [],
  excludeOwnerId?: string,
  competitionId?: string
): TeammateMatch[] {
  let pool = candidates.filter((t) => !excludeOwnerId || t.ownerId !== excludeOwnerId);
  if (competitionId) {
    pool = pool.filter((t) => (t.targetCompetitions ?? []).includes(competitionId));
  }
  return pool
    .map((t) => {
      const { score, reasons } =
        competitionId
          ? scoreForCompetition(profile, t, competitionId)
          : scoreGeneral(profile, t);
      return { teammate: t, score, reasons };
    })
    .sort((a, b) => b.score - a.score);
}
