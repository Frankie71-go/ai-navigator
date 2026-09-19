// 全局类型定义：比赛、用户画像、推荐结果
// 未来接入数据库 / LLM 时，这些类型即为契约，页面与推荐层无需改动。

// ===== 比赛数据契约（Competition） =====

/** AI 方向：用于筛选与匹配 */
export type AiDirection =
  | "计算机视觉"
  | "自然语言处理"
  | "大模型应用"
  | "机器学习"
  | "数据挖掘"
  | "多模态"
  | "智能机器人"
  | "AI+行业"
  | "生成式AI";

/** 比赛形式：用于「是否线上」筛选 */
export type CompetitionFormat = "线上" | "线下" | "线上线下结合";

/** 难度：用于难度筛选（你列的筛选条件之一，数据结构里补此字段以支撑筛选） */
export type Difficulty = "入门" | "初级" | "中级" | "高级";

/** 竞争程度：卡片展示用 */
export type CompetitionLevel = "低" | "中" | "高";

/** 赛事地域：国内 / 国际（支撑「国际比赛数据库」未来功能） */
export type Region = "domestic" | "international";

/** 赛事来源：官方收录 / 用户投稿（支撑「用户贡献比赛」未来功能） */
export type CompetitionSource = "official" | "community";

/** 审核状态：已通过 / 待审核 / 已拒绝（支撑「AI 验证 / 内容审核」流水线） */
export type CompetitionStatus = "approved" | "pending" | "rejected";

export interface Competition {
  id: string;                 // 唯一标识
  name: string;               // 比赛名称
  organizer: string;          // 主办方
  time: string;               // 比赛时间（如 "2026年8月-10月"）
  deadline: string;           // 报名截止
  format: CompetitionFormat;  // 比赛形式
  registration?: string;      // 报名方式（详情页展示用；你列的字段，补进契约）
  aiDirection: AiDirection[]; // AI方向（可多个）
  suitableFor: string[];      // 适合人群
  skills: string[];           // 技能要求
  difficulty: Difficulty;     // 难度（筛选维度）
  competitionLevel: CompetitionLevel; // 竞争程度
  verified: boolean;          // 验证状态（已核实 / 待核实）

  // —— 未来功能扩展字段（支撑：用户贡献比赛 / AI 验证 / 国际比赛库）——
  region: Region;             // 国内 / 国际
  source: CompetitionSource;  // 官方收录 / 用户投稿
  status: CompetitionStatus;  // 审核状态（内容审核流水线）

  // —— 详情页 / 推荐增强（可选字段，未来接 DB 时一并落表）——
  description?: string;       // 简介
  prizes?: string;            // 奖项
  tags?: string[];            // 与用户目标对齐的标签（推荐引擎用）
  officialUrl?: string;       // 官网链接
  registrationUrl?: string;   // 报名链接（可与官网不同，审查必填项）
  category?: string;          // 类型：算法赛 / 创意赛 / 应用创新赛 等（审查必填项）
}

/** 审查必填字段（用于内容完整性校验机制） */
export const REVIEW_REQUIRED_FIELDS = [
  "name",
  "time",
  "category",
  "aiDirection",
  "suitableFor",
  "officialUrl",
  "registrationUrl",
] as const;

// ===== 用户画像（UserProfile） =====

export type Identity = "高中生" | "本科生" | "研究生" | "其他";
export type Major = "计算机/工程" | "商科" | "社科" | "设计" | "其他";
export type AiLevel = "Level 0" | "Level 1" | "Level 2" | "Level 3" | "Level 4";

/** 技能评分维度（0-5 自评），用于替代旧的多选技能 */
export type SkillKey = "Coding" | "Research" | "Product" | "Presentation";

export interface UserProfile {
  identity?: Identity;
  major?: Major;
  aiLevel?: AiLevel;
  /** 四项技能自评（0 = 未评估，5 = 精通） */
  skillRatings: Record<SkillKey, number>;
  goals: string[];
  /** 人格特质（用于队友匹配） */
  personality?: string[];
  /** 想做的 AI 方向（用于比赛推荐与队友匹配共享） */
  aiDirection?: AiDirection[];
  /** 想参加的比赛（id 列表，用于"按比赛找队友"） */
  targetCompetitions?: string[];
  /** 一句话简介（用于队友匹配展示，共享自画像） */
  bio?: string;
  /** 可投入时间（用于队友匹配，共享自画像） */
  availability?: string;
  /** 既往项目经历（用于 AI 审查验证技能自评） */
  experiences?: ProjectExperience[];
}

/** 既往项目经历：作为技能自评的「客观证据」 */
export interface ProjectExperience {
  id: string;
  name: string; // 项目名称
  role: string; // 你的角色
  period: string; // 时间，如 "2025 春"
  skillsUsed: SkillKey[]; // 用到的技能维度
  summary: string; // 一句话描述 / 成果
  outcome?: string; // 获奖 / 发表 / 上线 等（强化证据）
}

// ===== 队友招募帖（访客自由发帖） =====
// 与结构化「候选队友」Teammate 解耦：访客无需完整画像，直接写标题+正文发布，
// 可选带入画像标签作为上下文（谁在找队友、想打什么比赛）。

export interface TeammatePost {
  id: string;
  /** 帖子标题（访客自编辑） */
  title: string;
  /** 帖子正文（访客自编辑，自由文本） */
  content: string;
  /** 展示昵称（可选；留空显示「匿名」） */
  authorName?: string;
  /** 匿名 ID（用于「我的帖子」删除 / 鉴权） */
  authorId?: string;
  /** 作者画像快照标签（可选，从「我的画像」带出作为上下文） */
  identity?: Identity;
  major?: Major;
  aiLevel?: AiLevel;
  skills?: SkillKey[];
  personality?: string[];
  goals?: string[];
  aiDirection?: AiDirection[];
  targetCompetitions?: string[];
  availability?: string;
  /** 直接关联的比赛 id（「组队打这场」） */
  competitionId?: string;
  /** 公开联系方式（可选） */
  contact?: string;
  /** 投稿时间（ISO） */
  createdAt: string;
}

// ===== 推荐结果（Recommendation） =====

export type RecommendBucket = "最适合" | "挑战型" | "探索型";

export interface Recommendation {
  competition: Competition;
  bucket: RecommendBucket;
  score: number;
  reasons: string[]; // 为什么推荐（Phase 2 由 LLM 增强）
}
