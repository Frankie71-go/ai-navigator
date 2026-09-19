// 主办方分类：把杂乱的原始主办方字符串归类成学生好理解的几个大类，
// 用于比赛库的「主办方」维度筛选。纯函数、集中映射，便于后续微调。

export const ORGANIZER_CATEGORIES = [
  "企业 / 大厂",
  "高校与学术学会",
  "政府与事业单位",
  "国际平台",
  "其他",
] as const;

export type OrganizerCategory = (typeof ORGANIZER_CATEGORIES)[number];

export function organizerCategory(org: string): OrganizerCategory {
  const s = org || "";
  if (/Kaggle|Google|WAIC|ARC\s*Prize|Foundation|FUTURE\s*TECH/i.test(s))
    return "国际平台";
  // 学术机构优先于企业（避免「XX大学 / 华为承办」被归到大厂）
  if (
    /教育部|学会|CCF|中国图象|中国学位|中国教育|科协|研究会|教指委|大学|学院|职业学院|组委会|高等学校/i.test(
      s
    )
  )
    return "高校与学术学会";
  if (
    /华为|昇腾|鲲鹏|阿里|淘宝|支付宝|钉钉|通义|亲橙|Token|ATH|百度|腾讯|元器|微信|QQ|京东|抖音|即梦|剪映|快手|字节|讯飞|中科大|认知智能|长光卫星|工商银行|雀巢|海艺|绘梦|AniShort|东方智媒|HappyHorse|蚂蚁/i.test(
      s
    )
  )
    return "企业 / 大厂";
  if (
    /政府|省|市|厅|局|卫健委|金融监管|自治区|广州|江苏|广东|广西|赣州|宝鸡|山西|杭州|江北|重庆|北京|上海|深圳|龙岗/i.test(
      s
    )
  )
    return "政府与事业单位";
  return "其他";
}
