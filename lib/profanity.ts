// lib/profanity.ts
// ============================================================================
// 发帖脏话过滤：中文（简体）/ 英文 / 粤语（繁体）三语词表 + 匹配器。
// 客户端（PostBoard 提交前拦截）与云函数 posts-submit（二次校验）共用同一规则，
// 防止有人直接打云函数 URL 绕过前端。
// ----------------------------------------------------------------------------
// 匹配策略：
//  - 英文：转小写 → 去掉所有非字母数字（破坏 "f u c k"）→ leetspeak 替换 →
//          子串匹配。刻意排除易误伤的裸词（ass/dick），只保留 asshole/dickhead 等长词，
//          避免 "class / pass / grass / Dickens" 被误杀。
//  - 中文/粤语：去掉所有空白与标点（破坏 "傻 逼" / "傻*逼"）→ 子串匹配。
// ============================================================================

// 英文词表（裸短词已剔除易误伤项；fuck/shit/bitch 等无合法英文词作子串包含，可放心子串）
const EN_WORDS = [
  "fuck",
  "fucking",
  "fucker",
  "motherfucker",
  "shit",
  "bullshit",
  "bitch",
  "asshole",
  "arsehole",
  "bastard",
  "cunt",
  "dickhead",
  "pussy",
  "whore",
  "slut",
  "twat",
  "prick",
  "jerk",
  "wank",
  "wanker",
  "nigger",
  "nigga",
  "faggot",
  "fag",
  "retard",
  "goddamn",
  "damn",
  "crap",
  "arse",
];

// 中文（简体）+ 粤语（繁体）词表
const ZH_WORDS = [
  // —— 简体中文 ——
  "傻逼",
  "傻屄",
  "煞笔",
  "沙比",
  "妈的",
  "他妈的",
  "她妈的",
  "你妈的",
  "混蛋",
  "浑蛋",
  "王八蛋",
  "王八羔子",
  "贱人",
  "婊子",
  "骚货",
  "狗日",
  "狗娘养的",
  "操你",
  "艹你",
  "日你",
  "干你",
  "鸡巴",
  "屌",
  "贱货",
  "放你妈",
  "去你妈",
  "滚你",
  "操他",
  "艹他",
  // —— 粤语（繁体）——
  "仆街",
  "閪",
  "撚",
  "柒",
  "含撚",
  "臭閪",
  "冚家鏟",
  "冚家",
  "死撚",
  "扮撚",
  "食撚",
  "撚樣",
  "柒頭",
  "鳩咪",
  "雞姦",
  "閪婆",
];

// 简单 leetspeak 还原
const LEET: Record<string, string> = {
  "0": "o",
  "1": "i",
  "3": "e",
  "4": "a",
  "5": "s",
  "7": "t",
  "@": "a",
  $: "s",
};

function normalizeEn(text: string): string {
  let s = text.toLowerCase().replace(/[^a-z0-9]/g, ""); // 非字母数字直接删，破坏 "f u c k"
  for (const k of Object.keys(LEET)) s = s.split(k).join(LEET[k]);
  return s;
}

function normalizeZh(text: string): string {
  // 去掉所有空白与标点（含 Unicode 标点/符号），破坏 "傻 逼" / "傻*逼"
  return text.replace(/[\s\p{P}\p{S}]/gu, "");
}

/** 返回命中的脏话词；未命中返回 null */
export function findProfanity(text: string): string | null {
  if (!text) return null;

  const en = normalizeEn(text);
  for (const w of EN_WORDS) {
    if (en.includes(w)) return w;
  }

  const zh = normalizeZh(text);
  for (const w of ZH_WORDS) {
    if (zh.includes(w)) return w;
  }

  return null;
}

/** 是否包含脏话 */
export function containsProfanity(text: string): boolean {
  return findProfanity(text) !== null;
}

export const PROFANITY_MESSAGE = "帖子内容包含不当用语，请修改后再发布。";
