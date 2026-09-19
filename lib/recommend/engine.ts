// engine.ts
// 类型化封装：recommendation.js 是纯 JS 规则引擎（无框架依赖、可替换为 AI 模型），
// 这里只提供 TypeScript 类型，页面层统一从本文件引入。

import type { Competition, UserProfile } from "@/lib/types";
import { recommend as _recommend, scoreMatch as _scoreMatch } from "./recommendation";
import { getLocalBehaviors } from "@/lib/cloudbase/db";
import { calibrateSkillRatings } from "@/lib/skill-calibration";

/** 单场评分明细 */
export interface ScoredItem {
  competition: Competition;
  background: number; // 背景匹配 0-100
  skill: number; // 技能匹配 0-100
  goal: number; // 目标匹配 0-100
  total: number; // 加权总分 0-100
  reasons: string[];
}

/** 推荐结果：三类分桶 */
export interface RecommendResult {
  best: ScoredItem[];
  challenge: ScoredItem[];
  explore: ScoredItem[];
}

/**
 * 主入口：传入画像与比赛，返回三分类推荐。
 * 内部自动读取本地匿名行为（浏览/点击/搜索/推荐），做轻量加权优化——
 * 用户越关注/搜过的方向，相关比赛在总分上获得小幅提升。
 */
export function recommend(profile: UserProfile, competitions: Competition[]): RecommendResult {
  const behaviors = getLocalBehaviors();
  // 用行为数据校准技能自评，抑制纯自评偏差（向上全强度 / 向下半强度，安全边界）
  const calibratedRatings = calibrateSkillRatings(profile, competitions, behaviors);
  const calibratedProfile: UserProfile = {
    ...profile,
    skillRatings: calibratedRatings,
  };
  return _recommend(calibratedProfile, competitions, behaviors) as unknown as RecommendResult;
}

/** 单场评分（详情页「AI 推荐区域」未来可调用） */
export function scoreMatch(profile: UserProfile, competition: Competition): ScoredItem {
  return _scoreMatch(profile, competition) as unknown as ScoredItem;
}
