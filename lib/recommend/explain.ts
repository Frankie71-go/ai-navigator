// explain.ts
// ============================================================================
// AI Navigator · AI 解释模块（第一版：规则模拟生成）
// ----------------------------------------------------------------------------
// 职责：把「用户画像 + 比赛信息 + 匹配结果」翻译成人话解释，输出三段结构：
//   - why       为什么推荐给你（一句话概括）
//   - strengths 优势（匹配上的地方）
//   - cautions  需要注意（风险 / 缺口 / 挑战）
//
// ⚠️ 接口设计（未来接 LLM API 的关键）：
//   `generateExplanation(input): Promise<MatchExplanation>` 是本模块唯一对外
//   接口，调用方（推荐页 / 详情页）只依赖它。
//
//   现在：委托 `generateExplanationMock`（纯规则拼装，零成本、可离线）。
//   未来：实现一个同签名的异步函数，例如
//       export async function generateExplanationLLM(input) {
//         const prompt = buildPrompt(input);            // 把画像/比赛/匹配序列化
//         const raw = await callLLM(prompt);            // 调 Claude / GLM / GPT
//         return parseLLM(raw);                         // 解析出 {why,strengths,cautions}
//       }
//   然后把 `generateExplanation` 内部改成 `return generateExplanationLLM(input)`，
//   页面层、推荐引擎、类型全部零改动。
// ============================================================================

import type { Competition, UserProfile } from "@/lib/types";
import type { ScoredItem } from "./engine";
import { AI_LEVEL_RANK, DIFFICULTY_RANK, SKILL_LABELS } from "@/lib/data/taxonomy";

/** 解释输出结构（LLM 与 mock 都必须返回此形状） */
export interface MatchExplanation {
  why: string;
  strengths: string[];
  cautions: string[];
}

/** 解释输入（来自推荐引擎的「匹配结果」+ 原始画像与比赛） */
export interface ExplainInput {
  profile: UserProfile;
  competition: Competition;
  match: ScoredItem;
}

/**
 * 唯一对外接口：生成一场比赛的推荐解释。
 * 现在用规则 mock；未来切换 LLM 只改这一行实现。
 */
export async function generateExplanation(
  input: ExplainInput
): Promise<MatchExplanation> {
  return generateExplanationMock(input);
}

// —— 规则 mock 实现（当前版本）——
// 说明：完全基于 match 的打分明细 + 画像字段拼装，不调用任何模型。
function generateExplanationMock({
  profile,
  competition: c,
  match,
}: ExplainInput): MatchExplanation {
  const strengths: string[] = [];
  const cautions: string[] = [];

  const ratings = profile.skillRatings || {};
  const topDims = Object.entries(ratings)
    .filter(([, v]) => v >= 3)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => ({ key: k, label: SKILL_LABELS[k] ?? k, v }));

  // —— 优势：把「匹配上」的维度翻译成具体表达 ——
  if (profile.identity && (c.suitableFor || []).includes(profile.identity)) {
    strengths.push(`你的身份（${profile.identity}）正是该比赛的目标人群`);
  }
  if (profile.major && match.background >= 50) {
    strengths.push(`你的专业（${profile.major}）与比赛方向相关`);
  }
  if (topDims.length) {
    const top = topDims[0];
    strengths.push(
      `你的${top.label}能力较强（自评 ${top.v}/5），与比赛「${
        c.aiDirection?.[0] ?? "AI"
      }」方向匹配`
    );
  }
  if (match.skill >= 50) {
    strengths.push(`你的技能自评可覆盖比赛约 ${Math.round(match.skill)}% 的所需能力`);
  }
  const goalHit = (profile.goals || []).filter((g) => (c.tags || []).includes(g));
  if (goalHit.length) {
    strengths.push(`比赛方向贴合你的参与目标（${goalHit.join("、")}）`);
  }

  // —— 需要注意：难度 / 竞争 / 技能缺口 ——
  const lv = profile.aiLevel ? AI_LEVEL_RANK[profile.aiLevel] ?? 1 : 1;
  const df = DIFFICULTY_RANK[c.difficulty] ?? 2;
  if (lv < df) {
    cautions.push(
      `该比赛技术要求较高（难度 ${c.difficulty}），高于你当前的 AI 水平（${
        profile.aiLevel ?? "未填写"
      }），需要额外投入学习`
    );
  }
  if (c.competitionLevel === "高") {
    cautions.push(`竞争程度较高（${c.competitionLevel}），获奖有一定挑战`);
  }
  for (const r of match.reasons) {
    if (r.includes("尚未充分评估")) cautions.push(r);
  }

  // —— 为什么推荐（一句话概括）——
  const bits: string[] = [];
  if (topDims.length)
    bits.push(`你的${topDims[0].label}能力与「${c.aiDirection?.[0] ?? "AI"}」方向匹配`);
  if (goalHit.length) bits.push(`方向贴合你的目标（${goalHit.join("、")}）`);
  if (profile.major && match.background >= 50) bits.push(`专业（${profile.major}）对口`);
  const why = bits.length
    ? bits.join("，") + "。"
    : "这场比赛方向较新，适合你作为探索与成长机会。";

  // 兜底，避免空列表
  if (!strengths.length) strengths.push("方向新颖，可作为跨出舒适区的尝试");
  if (!cautions.length) cautions.push("当前画像下未见明显风险，可放心尝试");

  return { why, strengths, cautions };
}
