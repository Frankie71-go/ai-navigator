// 枚举字典：用于画像表单选项与比赛字段约束。
// 扩展新方向 / 技能 / 目标时，只改这里。

// —— 比赛相关枚举 ——
export const AI_DIRECTIONS = [
  "计算机视觉",
  "自然语言处理",
  "大模型应用",
  "机器学习",
  "数据挖掘",
  "多模态",
  "智能机器人",
  "AI+行业",
  "生成式AI",
] as const;

export const COMPETITION_FORMATS = ["线上", "线下", "线上线下结合"] as const;
export const DIFFICULTIES = ["入门", "初级", "中级", "高级"] as const;
export const COMPETITION_LEVELS = ["低", "中", "高"] as const;

// —— 比赛类型（支撑「类型」筛选与审查必填项）——
export const CATEGORIES = [
  "算法赛",
  "创意赛",
  "应用创新赛",
  "技术挑战赛",
  "机器人赛",
  "综合创新创业赛",
  "知识竞赛",
] as const;
export const CATEGORY_LABEL: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c, c])
);

// —— 扩展字段枚举（地域 / 来源 / 审核状态）——
export const REGIONS = ["国内", "国际"] as const;
export const REGION_LABEL: Record<string, string> = {
  domestic: "国内",
  international: "国际",
};
export const SOURCE_LABEL: Record<string, string> = {
  official: "官方收录",
  community: "用户投稿",
};
export const STATUS_LABEL: Record<string, string> = {
  approved: "已通过",
  pending: "待审核",
  rejected: "已拒绝",
};

// —— 用户画像枚举 ——
export const IDENTITIES = ["高中生", "本科生", "研究生", "其他"] as const;

export const MAJORS = ["计算机/工程", "商科", "社科", "设计", "其他"] as const;

export const AI_LEVELS = ["Level 0", "Level 1", "Level 2", "Level 3", "Level 4"] as const;

/** 技能评分维度（0-5 自评） */
export const SKILL_RATINGS = ["Coding", "Research", "Product", "Presentation"] as const;

/** 技能维度中文标签，用于表单与解释文案 */
export const SKILL_LABELS: Record<string, string> = {
  Coding: "编程 Coding",
  Research: "研究 Research",
  Product: "产品 Product",
  Presentation: "表达 Presentation",
};

export const GOALS = ["学习AI", "提升简历", "获奖", "创业", "寻找机会"] as const;

/** 人格特质（用于队友匹配） */
export const PERSONALITIES = [
  "领导者",
  "执行者",
  "创意脑",
  "分析派",
  "沟通型",
  "全能型",
] as const;

// 等级 / 难度排序，供推荐引擎比较
export const AI_LEVEL_RANK: Record<string, number> = {
  "Level 0": 0,
  "Level 1": 1,
  "Level 2": 2,
  "Level 3": 3,
  "Level 4": 4,
};

export const DIFFICULTY_RANK: Record<string, number> = {
  入门: 1,
  初级: 2,
  中级: 3,
  高级: 4,
};
