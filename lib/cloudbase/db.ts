// lib/cloudbase/db.ts
// ============================================================================
// AI Navigator · 数据访问层（腾讯云云开发 CloudBase 版）
// ----------------------------------------------------------------------------
// 职责：队友投稿的「云端读写 + 本地兜底」，以及匿名行为埋点（本地）。
// 设计：云端优先、本地兜底。
//   - 配置了 NEXT_PUBLIC_TCB_ENV：队友投稿走 teammate-ops 云函数（全站共享）。
//   - 未配置 / 云函数失败：队友投稿与读取回退浏览器 localStorage（按 ownerId upsert）。
//   - 画像由前端 zustand+persist 本地持久化，无需云端；trackBehavior 本地记录 +
//     火速上报云端 behaviors 云函数（HTTP 访问服务，免费版可用），失败静默回退本地。
// 所有函数签名与旧 supabase/db.ts 保持一致，调用方零改动。
// ============================================================================

import { callTcbFunction } from "./client";
import type { SkillKey, UserProfile, TeammatePost } from "@/lib/types";
import type { Teammate } from "@/lib/teammates";

export type BehaviorType =
  | "view" // 浏览比赛详情
  | "click" // 点击比赛卡片
  | "search" // 搜索关键词
  | "recommend_view" // 查看推荐结果
  | "save"; // 收藏

// —— 本地行为存储（localStorage）——
const LB_KEY = "ai-navigator-behaviors";
const LB_MAX = 500;

export interface LocalBehavior {
  ts: string;
  anonId: string;
  competitionId: string;
  type: BehaviorType;
  metadata: Record<string, unknown>;
}

/** 读取本地行为记录。SSR / 无 window 时返回空数组。 */
export function getLocalBehaviors(): LocalBehavior[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LB_KEY);
    return raw ? (JSON.parse(raw) as LocalBehavior[]) : [];
  } catch {
    return [];
  }
}

function recordLocal(
  anonId: string,
  competitionId: string,
  type: BehaviorType,
  metadata: Record<string, unknown>
): void {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(LB_KEY);
    const arr = raw ? (JSON.parse(raw) as LocalBehavior[]) : [];
    arr.push({ ts: new Date().toISOString(), anonId, competitionId, type, metadata });
    while (arr.length > LB_MAX) arr.shift();
    window.localStorage.setItem(LB_KEY, JSON.stringify(arr));
  } catch {
    /* 隐私模式等写入失败：静默忽略 */
  }
}

/**
 * 保存画像：画像由前端 zustand+persist 本地持久化，云端无需重复存储。
 * 保留签名仅为兼容调用方；如需跨设备同步，可在 teammate-ops 中扩展。
 */
export async function saveProfile(_anonId: string, _profile: UserProfile): Promise<void> {
  return;
}

/**
 * 行为埋点：本地匿名记录（用于推荐/校准优化），并火速上报云端 behaviors 云函数。
 * 云端上报为「即发即弃」（fire-and-forget），任何失败都静默忽略，绝不阻塞 UI，
 * 也不影响本地记录——未部署云函数 / 未配置 URL 时自动退化为纯本地模式。
 */
export async function trackBehavior(
  anonId: string | undefined,
  competitionId: string,
  type: BehaviorType,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  if (anonId) recordLocal(anonId, competitionId, type, metadata);
  if (anonId) void reportBehaviorCloud(anonId, competitionId, type, metadata);
}

/**
 * 上报到云端 behaviors 云函数（HTTP 访问服务公开 URL，绕开免费版无匿名登录限制）。
 * 仿照 client.ts 中 ai-verify 的 HTTP 调用方式：未配置 URL 直接跳过。
 */
export async function reportBehaviorCloud(
  anonId: string | undefined,
  competitionId: string,
  type: BehaviorType,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  const url = import.meta.env.VITE_BEHAVIORS_HTTP_URL as string | undefined;
  if (!url) return;
  try {
    const payload: Record<string, unknown> = {
      anonId,
      competitionId,
      type,
      metadata,
    };
    if (type === "search" && metadata?.keyword) {
      payload.keyword = metadata.keyword;
    }
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    /* 上报失败静默：本地记录仍在，用户体验不受影响 */
  }
}

/** 反馈提交：保留签名，当前仅本地（可选后续接云函数）。 */
export async function submitFeedback(
  _anonId: string | undefined,
  _competitionId: string | null,
  _rating: number,
  _comment: string
): Promise<void> {
  return;
}

// —— 队友投稿：云端 + 本地兜底 ——
const TM_KEY = "ai-navigator-teammates";

/** CloudBase 行 → Teammate 对象（兼容 _id / id） */
function mapRowToTeammate(r: Record<string, unknown>): Teammate {
  return {
    id: String(r.id ?? r._id ?? ""),
    name: String(r.name ?? ""),
    identity: r.identity as Teammate["identity"],
    major: r.major as Teammate["major"],
    aiLevel: r.aiLevel as Teammate["aiLevel"],
    skills: (r.skills as SkillKey[]) ?? [],
    personality: (r.personality as string[]) ?? [],
    goals: (r.goals as string[]) ?? [],
    aiDirection: (r.aiDirection as Teammate["aiDirection"]) ?? [],
    targetCompetitions: (r.targetCompetitions as string[]) ?? [],
    bio: String(r.bio ?? ""),
    preferredContact: String(r.preferredContact ?? ""),
    availability: String(r.availability ?? ""),
    ownerId: r.ownerId ? String(r.ownerId) : undefined,
    source: "user",
    createdAt: r.createdAt ? String(r.createdAt) : undefined,
  };
}

/**
 * 投稿成为候选队友。
 * - 配置了 CloudBase：走 teammate-ops 云函数（全站共享）。
 * - 失败 / 未配置：写入本地 localStorage（按 ownerId upsert）。
 * 返回 local=true 表示走本地回退。
 */
export async function submitTeammate(t: Teammate): Promise<{ local: boolean }> {
  const res = await callTcbFunction("teammate-ops", { action: "submit", payload: t });
  if (res && res.ok) return { local: false };

  // 本地回退
  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(TM_KEY);
      const arr = raw ? (JSON.parse(raw) as Teammate[]) : [];
      const next = arr.filter((x) => x.ownerId !== t.ownerId);
      next.push(t);
      window.localStorage.setItem(TM_KEY, JSON.stringify(next));
    } catch {
      /* 写入失败：静默忽略 */
    }
  }
  return { local: true };
}

/**
 * 读取候选队友池：内置演示 + 用户投稿。
 * - 配置了 CloudBase 且云函数正常：返回云端的用户投稿。
 * - 失败 / 未配置：返回本地 localStorage 投稿。
 * SSR / 无 window 时返回空数组（无内置演示数据）。
 */
export async function loadTeammates(): Promise<Teammate[]> {
  const res = await callTcbFunction("teammate-ops", { action: "list" });
  if (res && Array.isArray(res.rows)) {
    return (res.rows as Record<string, unknown>[]).map(mapRowToTeammate);
  }

  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(TM_KEY);
    const local = raw ? (JSON.parse(raw) as Teammate[]) : [];
    return local;
  } catch {
    return [];
  }
}

/**
 * 取消发布：撤回当前 ownerId 的候选池投稿。
 * - 配置了 CloudBase：走 teammate-ops 云函数 delete action（运行时管理员凭证，可真删）。
 * - 无论云端成败，都顺手清掉本地 localStorage 中的对应投稿（幂等、避免脏数据）。
 * 返回 local=true 表示云端删除未生效（仅本地被清）。
 */
export async function deleteTeammate(ownerId: string): Promise<{ local: boolean }> {
  const res = await callTcbFunction("teammate-ops", { action: "delete", payload: { ownerId } });

  // 本地兜底/清理：云端成功或失败都清一次，保证本地不再残留
  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(TM_KEY);
      const arr = raw ? (JSON.parse(raw) as Teammate[]) : [];
      const next = arr.filter((x) => x.ownerId !== ownerId);
      window.localStorage.setItem(TM_KEY, JSON.stringify(next));
    } catch {
      /* 写入失败：静默忽略 */
    }
  }

  if (res && res.ok) return { local: false };
  return { local: true };
}

// —— 队友招募帖：云端 + 本地兜底（与候选队友共用 teammate-ops 云函数通道）——
const POST_KEY = "ai-navigator-posts";

/** CloudBase 行 → TeammatePost 对象（兼容 _id / id） */
function mapRowToPost(r: Record<string, unknown>): TeammatePost {
  return {
    id: String(r.id ?? r._id ?? ""),
    title: String(r.title ?? ""),
    content: String(r.content ?? ""),
    authorName: r.authorName ? String(r.authorName) : undefined,
    authorId: r.authorId ? String(r.authorId) : undefined,
    identity: r.identity as TeammatePost["identity"],
    major: r.major as TeammatePost["major"],
    aiLevel: r.aiLevel as TeammatePost["aiLevel"],
    skills: (r.skills as SkillKey[]) ?? [],
    personality: (r.personality as string[]) ?? [],
    goals: (r.goals as string[]) ?? [],
    aiDirection: (r.aiDirection as TeammatePost["aiDirection"]) ?? [],
    targetCompetitions: (r.targetCompetitions as string[]) ?? [],
    availability: r.availability ? String(r.availability) : undefined,
    competitionId: r.competitionId ? String(r.competitionId) : undefined,
    contact: r.contact ? String(r.contact) : undefined,
    createdAt: r.createdAt ? String(r.createdAt) : new Date().toISOString(),
  };
}

/**
 * 发布 / 更新一条招募帖。
 * - 配置了 CloudBase（VITE_TEAMMATE_HTTP_URL）：走 teammate-ops 云函数的 posts-submit（全站共享）。
 * - 未配置 / 云函数失败：写入本地 localStorage（按 id upsert，置顶）。
 * 返回 local=true 表示走本地回退（仅本机可见）。
 */
export async function submitPost(p: TeammatePost): Promise<{ local: boolean }> {
  const res = await callTcbFunction("teammate-ops", { action: "posts-submit", payload: p });
  if (res && res.ok) return { local: false };

  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(POST_KEY);
      const arr = raw ? (JSON.parse(raw) as TeammatePost[]) : [];
      const next = arr.filter((x) => x.id !== p.id);
      next.unshift(p);
      window.localStorage.setItem(POST_KEY, JSON.stringify(next));
    } catch {
      /* 写入失败：静默忽略 */
    }
  }
  return { local: true };
}

/**
 * 读取招募帖列表。
 * - 云函数正常：返回全站共享的帖子（按时间倒序）。
 * - 失败 / 未配置：返回本机 localStorage 帖子。
 * SSR / 无 window 时返回空数组。
 */
export async function loadPosts(): Promise<TeammatePost[]> {
  const res = await callTcbFunction("teammate-ops", { action: "posts-list" });
  if (res && Array.isArray(res.rows)) {
    return (res.rows as Record<string, unknown>[]).map(mapRowToPost);
  }
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(POST_KEY);
    return raw ? (JSON.parse(raw) as TeammatePost[]) : [];
  } catch {
    return [];
  }
}

/**
 * 删除一条招募帖（按 id）。
 * - 配置了 CloudBase：走 teammate-ops 云函数 posts-delete（运行时管理员凭证，可真删）。
 * - 无论云端成败，都顺手清掉本地 localStorage 中的对应帖（幂等、避免脏数据）。
 * 返回 local=true 表示云端删除未生效（仅本地被清）。
 */
export async function deletePost(id: string, authorId?: string): Promise<{ local: boolean }> {
  const res = await callTcbFunction("teammate-ops", {
    action: "posts-delete",
    payload: { id, authorId },
  });

  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(POST_KEY);
      const arr = raw ? (JSON.parse(raw) as TeammatePost[]) : [];
      const next = arr.filter((x) => x.id !== id);
      window.localStorage.setItem(POST_KEY, JSON.stringify(next));
    } catch {
      /* 写入失败：静默忽略 */
    }
  }

  if (res && res.ok) return { local: false };
  return { local: true };
}
