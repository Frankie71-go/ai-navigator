/**
 * 给每个标签一个稳定且和谐的「突出颜色」——这正是网站早期被喜欢的设计语言，
 * 这里做得更精致：低饱和底色 + 同色系深色文字 + 细描边 + 小圆点，既不廉价也不刺眼。
 * 通过标签文本哈希稳定映射，保证同一方向每次颜色一致。
 */
const PALETTE = [
  "bg-cyan-500/12 text-cyan-700 border border-cyan-500/30",
  "bg-sky-500/12 text-sky-700 border border-sky-500/30",
  "bg-blue-500/12 text-blue-700 border border-blue-500/30",
  "bg-indigo-500/12 text-indigo-700 border border-indigo-500/30",
  "bg-violet-500/12 text-violet-700 border border-violet-500/30",
  "bg-fuchsia-500/12 text-fuchsia-700 border border-fuchsia-500/30",
  "bg-rose-500/12 text-rose-700 border border-rose-500/30",
  "bg-teal-500/12 text-teal-700 border border-teal-500/30",
  "bg-emerald-500/12 text-emerald-700 border border-emerald-500/30",
  "bg-amber-500/12 text-amber-700 border border-amber-500/30",
];

export function tagColor(label: string): string {
  let h = 0;
  for (let i = 0; i < label.length; i++) {
    h = (h * 31 + label.charCodeAt(i)) >>> 0;
  }
  return PALETTE[h % PALETTE.length];
}
