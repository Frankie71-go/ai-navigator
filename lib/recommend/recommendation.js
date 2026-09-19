// recommendation.js
// ============================================================================
// AI Navigator · 第一版推荐算法（规则匹配，无机器学习）
// ----------------------------------------------------------------------------
// 设计原则：
//   1. 纯函数、零框架依赖（不引入 React / Next / 数据库）。
//   2. 输入 / 输出契约稳定，未来可直接替换为 AI 模型——
//      只需实现相同签名的 `recommend(profile, competitions)` 即可，
//      页面层与推荐层无需改动。
//   3. 比赛与用户都拥有「标签」，匹配即标签重叠 + 规则打分。
//
// 匹配分数 = 背景匹配 35% + 技能匹配 35% + 目标匹配 30%（各 0-100）
// ============================================================================

// —— 权重（背景 / 技能 / 目标）——
const WEIGHTS = { background: 0.35, skill: 0.35, goal: 0.3 };

// 用户 AI 水平 → 数值（Level 0-4）
const AI_LEVEL_RANK = {
  "Level 0": 0,
  "Level 1": 1,
  "Level 2": 2,
  "Level 3": 3,
  "Level 4": 4,
};

// 比赛难度 → 数值
const DIFFICULTY_RANK = { 入门: 1, 初级: 2, 中级: 3, 高级: 4 };

// 比赛「技能要求」关键字 → 用户「技能维度」映射
// （比赛技能词是具体技术，用户自评是抽象维度，此处做桥接）
export const SKILL_MAP = {
  Coding: ["Python", "编程", "代码", "开发", "算法", "机器学习", "深度学习", "数据分析", "计算机视觉", "自然语言处理", "大模型", "PyTorch", "TensorFlow", "C++", "Java"],
  Research: ["研究", "调研", "论文", "学术", "实验", "机器学习", "深度学习", "数据分析", "建模"],
  Product: ["产品设计", "产品", "商业分析", "落地", "方案", "策划", "运营", "大模型", "市场"],
  Presentation: ["写作", "表达", "路演", "答辩", "展示", "汇报", "演讲", "PPT"],
};

// 用户「专业」→ 比赛适合人群中的命中关键字
const MAJOR_KEYWORDS = {
  "计算机/工程": ["计算机", "工程", "理工", "软件", "电子", "人工智能", "数据", "信息"],
  "商科": ["商", "经管", "金融", "市场", "商业", "财"],
  "社科": ["社科", "人文", "社会", "公共管理", "政治", "法律"],
  "设计": ["设计", "艺术", "交互", "视觉", "用户体验"],
  "其他": [],
};

/** 将某个比赛技能词映射到用户技能维度（可命中多个） */
export function skillToDimensions(skill) {
  const dims = [];
  for (const [dim, kws] of Object.entries(SKILL_MAP)) {
    if (kws.some((k) => skill.includes(k))) dims.push(dim);
  }
  return dims;
}

// —— 三大维度打分（各返回 0-100 + 解释理由）——

/**
 * 背景匹配：身份是否在对口人群 + 专业是否相关 + 当前水平与难度关系
 */
function scoreBackground(profile, c) {
  let s = 0;
  const reasons = [];

  // 身份
  if (profile.identity && (c.suitableFor || []).includes(profile.identity)) {
    s += 40;
    reasons.push(`你的身份（${profile.identity}）符合该比赛适合人群`);
  }

  // 专业（关键字命中适合人群 / 方向）
  if (profile.major) {
    const hay = [...(c.suitableFor || []), ...(c.aiDirection || [])].join(" ");
    const kws = MAJOR_KEYWORDS[profile.major] || [];
    if (kws.some((k) => hay.includes(k))) {
      s += 30;
      reasons.push(`你的专业（${profile.major}）与该比赛方向相关`);
    }
  }

  // 水平 vs 难度
  const lv = profile.aiLevel ? AI_LEVEL_RANK[profile.aiLevel] ?? 1 : 1;
  const df = DIFFICULTY_RANK[c.difficulty] ?? 2;
  if (lv >= df) {
    s += 30;
    reasons.push("当前 AI 水平足以应对比赛难度");
  } else if (lv >= df - 1) {
    s += 20;
    reasons.push("难度略高于当前水平，是很好的成长机会");
  } else {
    s += 10;
    reasons.push("难度明显高于当前水平，需要大量学习");
  }

  return { score: Math.min(100, s), reasons };
}

/**
 * 技能匹配：比赛所需技能 → 用户对应维度自评覆盖度
 */
function scoreSkill(profile, c) {
  const skills = c.skills || [];
  if (!skills.length) return { score: 50, reasons: [] }; // 无要求，中性

  const ratings = profile.skillRatings || {};
  let sum = 0;
  const uncovered = [];

  for (const sk of skills) {
    const dims = skillToDimensions(sk);
    let cov;
    if (dims.length) {
      cov = Math.max(...dims.map((d) => (ratings[d] || 0) / 5));
      if (cov < 0.6) uncovered.push(sk);
    } else {
      cov = 0.5; // 未映射技能，不强行扣分
    }
    sum += cov;
  }

  const score = Math.round((sum / skills.length) * 100);
  const reasons = [];
  const top = Object.entries(ratings)
    .filter(([, v]) => v >= 3)
    .map(([k]) => k);
  if (top.length) {
    reasons.push(`你在 ${top.join("、")} 上自评较强，能支撑比赛所需能力`);
  }
  if (uncovered.length) {
    reasons.push(
      `部分所需技能（如 ${uncovered.slice(0, 3).join("、")}）你尚未充分评估，可作为挑战方向`
    );
  }
  return { score, reasons };
}

/**
 * 目标匹配：用户目标 ∩ 比赛标签（tags）
 */
function scoreGoal(profile, c) {
  const goals = profile.goals || [];
  const ctags = c.tags || [];
  if (!goals.length || !ctags.length) return { score: 0, reasons: [] };

  const hit = goals.filter((g) => ctags.includes(g));
  const score = Math.min(100, hit.length * 50);
  const reasons = hit.length
    ? [`比赛方向与你的目标（${hit.join("、")}）一致`]
    : [];
  return { score, reasons };
}

// —— 单场综合评分 ——

/**
 * 对单场比赛计算匹配明细。
 * @returns {{ background:number, skill:number, goal:number, total:number, lv:number, df:number, goalHit:boolean, reasons:string[] }}
 */
export function scoreMatch(profile, c) {
  const b = scoreBackground(profile, c);
  const sk = scoreSkill(profile, c);
  const g = scoreGoal(profile, c);

  const total = Math.round(
    b.score * WEIGHTS.background + sk.score * WEIGHTS.skill + g.score * WEIGHTS.goal
  );

  const lv = profile.aiLevel ? AI_LEVEL_RANK[profile.aiLevel] ?? 1 : 1;
  const df = DIFFICULTY_RANK[c.difficulty] ?? 2;

  const reasons = [...b.reasons, ...sk.reasons, ...g.reasons];
  if (!reasons.length) reasons.push("方向较新，适合开阔视野、跨出舒适区");

  return {
    competition: c,
    background: b.score,
    skill: sk.score,
    goal: g.score,
    total,
    lv,
    df,
    goalHit: g.score > 0,
    reasons,
  };
}

// —— 三分类 ——

/**
 * 将已评分的比赛分入三类。
 *   最适合：匹配度最高（总分高且能力基本胜任）
 *   挑战型：匹配度较高但难度高于当前水平
 *   探索型：兴趣相关（目标命中）但总分偏低
 */
function categorize(items) {
  const best = [];
  const challenge = [];
  const explore = [];

  for (const it of items) {
    const capable = it.lv >= it.df - 1; // 能力胜任或仅略低
    if (it.total >= 55 && capable) {
      best.push(it);
    } else if (it.lv < it.df && it.total >= 30) {
      challenge.push(it);
    } else if (it.goalHit && it.total >= 12) {
      explore.push(it);
    } else if (it.total >= 12) {
      explore.push(it); // 兜底：有一定关联但偏低，归入探索
    }
  }

  const byScoreDesc = (a, b) => b.total - a.total;
  best.sort(byScoreDesc);
  challenge.sort(byScoreDesc);
  explore.sort(byScoreDesc);

  // 兜底：若三类皆空但确有评分项，把最高分的一场放进「最适合」
  if (!best.length && !challenge.length && !explore.length && items.length) {
    best.push([...items].sort(byScoreDesc)[0]);
  }

  return { best, challenge, explore };
}

// —— 行为加权（基于匿名本地行为优化推荐）——
//
// 设计：不引入任何框架 / 后端依赖，仅消费调用方传入的 behaviors 数组。
// 加权温和（封顶），避免覆盖规则匹配的主体逻辑：
//   - 浏览 / 点击 / 推荐曝光 同一比赛 → 每命中 1 次 +3，封顶 +12
//   - 搜索关键词命中比赛的 名称/方向/技能/标签/人群 → +5
// 这些行为数据来自 localStorage（匿名、无 PII），未来也可来自 Supabase。

/**
 * 计算每场比赛的行为加权值（competitionId -> 加分）。
 * @param {Object[]} competitions
 * @param {Array} behaviors  形如 [{ competitionId, type, metadata:{keyword?} }]
 * @returns {Object} 形如 { [competitionId]: number }
 */
function computeBoost(competitions, behaviors) {
  const interest = {}; // competitionId -> 命中次数
  const keywords = [];

  for (const b of behaviors || []) {
    if (
      (b.type === "view" || b.type === "click" || b.type === "recommend_view") &&
      b.competitionId
    ) {
      interest[b.competitionId] = (interest[b.competitionId] || 0) + 1;
    }
    if (b.type === "search" && b.metadata && b.metadata.keyword) {
      keywords.push(String(b.metadata.keyword).toLowerCase());
    }
  }

  const kwSet = [...new Set(keywords)];
  const map = {};

  for (const c of competitions) {
    let score = 0;
    if (interest[c.id]) score += Math.min(interest[c.id] * 3, 12);

    if (kwSet.length) {
      const hay = `${c.name} ${(c.aiDirection || []).join(" ")} ${(
        c.skills || []
      ).join(" ")} ${(c.tags || []).join(" ")} ${(c.suitableFor || []).join(
        " "
      )}`.toLowerCase();
      if (kwSet.some((k) => hay.includes(k))) score += 5;
    }

    if (score) map[c.id] = score;
  }
  return map;
}

// —— 主入口（页面调用此函数）——
//
// ⚠️ 未来替换 AI 模型：实现一个同样签名、
//    同样返回 { best, challenge, explore } 形状的异步函数即可，
//    例如：
//      export async function recommendAI(profile, competitions) {
//        // 调用 LLM，传入 profile + competitions，解析出三分类
//      }
//    页面层无需改动。

/**
 * @param {Object} profile  用户画像（identity/major/aiLevel/skillRatings/goals）
 * @param {Object[]} competitions  比赛列表
 * @param {Array} [behaviors]  匿名本地行为记录（用于优化推荐），可选
 * @returns {{ best:Object[], challenge:Object[], explore:Object[] }}
 */
export function recommend(profile, competitions = [], behaviors = []) {
  const boost = computeBoost(competitions, behaviors);

  const items = competitions
    .map((c) => {
      const it = scoreMatch(profile, c);
      const b = boost[c.id] || 0;
      if (b) it.total = Math.min(100, it.total + b); // 温和加权，封顶 100
      return it;
    })
    .filter((it) => it.total > 0 || it.goalHit);

  return categorize(items);
}
