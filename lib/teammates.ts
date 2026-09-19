// 队友池类型定义与（空）默认数据。
// 真实数据来自「用户投稿」（localStorage 兜底 / 云端 teammates 集合），
// 不再内置任何虚拟演示队友。

import type { AiDirection, Identity, Major, AiLevel, SkillKey } from "@/lib/types";

export interface Teammate {
  id: string;
  name: string;        // 展示用的花名（不收集真实姓名/隐私）
  identity: Identity;
  major: Major;
  aiLevel: AiLevel;
  skills: SkillKey[];
  personality: string[]; // 人格特质
  goals: string[];       // 参赛目的
  aiDirection: AiDirection[];
  /** 想参加的比赛（id 列表）——支撑"按比赛找队友" */
  targetCompetitions?: string[];
  bio: string;
  /** 联系方式展示串，形如「微信 · abc123」（由投稿表单的 平台+账号 拼成） */
  preferredContact: string;
  availability: string;     // 可投入时间
  /** 投稿者匿名 ID；演示数据为 undefined（mock） */
  ownerId?: string;
  /** 数据来源：user = 用户投稿 */
  source?: "user";
  /** 投稿时间（ISO） */
  createdAt?: string;
}

// 默认无内置数据；候选池完全由用户投稿构成。
export const TEAMMATES: Teammate[] = [];
