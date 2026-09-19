import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Tag } from "@/components/ui/Tag";
import { Card } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { StatusBadge } from "@/components/competition/StatusBadge";
import { Reveal } from "@/components/ui/Reveal";
import { getCompetitions } from "@/lib/data-source";
import { getRegStatus } from "@/lib/registration";
import type { Competition } from "@/lib/types";

const POPULAR = ["大模型", "计算机视觉", "视频生成", "智能体", "金融"];

const FEATURES = [
  {
    step: "01",
    href: "/competitions",
    title: "AI比赛数据库",
    desc: "收录国内各类 AI 比赛，支持关键词搜索与方向、难度、形式、地域多维筛选。",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth="1.8">
        <ellipse cx="12" cy="5" rx="8" ry="3" />
        <path d="M4 5v6c0 1.66 3.58 3 8 3s8-1.34 8-3V5" />
        <path d="M4 11v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6" />
      </svg>
    ),
  },
  {
    step: "02",
    href: "/profile",
    title: "个性化匹配",
    desc: "结合你的身份、专业、AI 水平、技能与目标，定位更对味的参赛场次。",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c0-4 3.58-6 8-6s8 2 8 6" />
        <path d="M18.5 3.5l2 2-2 2M21.5 5.5h-4" />
      </svg>
    ),
  },
  {
    step: "03",
    href: "/recommend",
    title: "AI推荐分析",
    desc: "不只告诉你推荐什么，还用规则引擎解释为什么这场比赛适合你。",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 3l1.8 4.6L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.4z" />
        <path d="M18 14l.9 2.3L21 17l-2.1.9L18 20l-.9-2.1L15 17l2.1-.7z" />
      </svg>
    ),
  },
];

export default function HomePage() {
  const [all, setAll] = useState<Competition[] | null>(null);
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const goSearch = (term: string) => {
    const t = term.trim();
    if (!t) return;
    navigate(`/competitions?q=${encodeURIComponent(t)}`);
  };

  useEffect(() => {
    let active = true;
    getCompetitions().then((cs) => {
      if (active) setAll(cs);
    });
    return () => {
      active = false;
    };
  }, []);

  // 仅展示「正在报名 / 即将截止」的比赛，按截止日升序取前 6 场
  const live = (all ?? []).filter((c) => getRegStatus(c).status !== "closed");
  const open = live
    .slice()
    .sort((a, b) => a.deadline.localeCompare(b.deadline))
    .slice(0, 6);

  return (
    <div>
      {/* Hero */}
      <Reveal>
        <section className="container-page relative overflow-hidden py-16 text-center sm:py-24">
        {/* 装饰光斑（安静极光氛围，低透明度） */}
        <div className="pointer-events-none absolute -top-10 left-[10%] h-48 w-48 rounded-full bg-accent/18 blur-3xl animate-float" />
        <div className="pointer-events-none absolute top-2 right-[12%] h-40 w-40 rounded-full bg-accent2/14 blur-3xl animate-float [animation-delay:1.5s]" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent3/12 blur-3xl animate-float [animation-delay:0.8s]" />
        <div className="mx-auto max-w-3xl">
          <Tag tone="accent" className="mb-6">
            <span className="mr-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-accent-warm" />
            AI OPPORTUNITY NAVIGATOR
          </Tag>
          <h1 className="font-display text-5xl font-bold leading-tight tracking-tight sm:text-7xl">
            <span className="text-gradient-neon text-glow">你的 AI 机会导航器</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
            AI 分析你的背景、技能与目标，
            <br />
            精准推荐最适合你的 AI 比赛与组队机会。
          </p>

          {/* 搜索：目录型产品的首要 CTA（ui-ux-pro-max · Directory 模式） */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              goSearch(q);
            }}
            className="mx-auto mt-9 flex w-full max-w-xl items-center gap-2 rounded-full border border-line bg-white/70 p-1.5 shadow-glass backdrop-blur-xl transition focus-within:border-accent/50 focus-within:shadow-neon"
          >
            <svg viewBox="0 0 24 24" fill="none" className="ml-3 h-5 w-5 shrink-0 text-muted" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" />
            </svg>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="搜比赛 / 方向 / 主办方，如「大模型」「视觉」"
              className="min-w-0 flex-1 bg-transparent py-2 text-sm text-ink outline-none placeholder:text-muted/70"
              aria-label="搜索比赛"
            />
            <button
              type="submit"
              className="shrink-0 rounded-full bg-gradient-to-r from-accent to-accent2 px-5 py-2 text-sm font-semibold text-white shadow-neon transition hover:shadow-neon-warm hover:brightness-105"
            >
              搜索
            </button>
          </form>

          {/* 热门搜索建议 */}
          <div className="mx-auto mt-3 flex max-w-xl flex-wrap justify-center gap-2">
            {POPULAR.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => {
                  setQ(p);
                  goSearch(p);
                }}
                className="rounded-full border border-line bg-white/50 px-3 py-1 text-xs text-muted transition hover:border-accent/50 hover:text-accent"
              >
                {p}
              </button>
            ))}
          </div>

          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <LinkButton href="/profile" className="font-display tracking-wide">
              开始 AI 匹配 →
            </LinkButton>
            <LinkButton href="/competitions" variant="secondary" className="font-display tracking-wide">
              浏览全部比赛
            </LinkButton>
          </div>
        </div>
      </section>
      </Reveal>

      {/* 核心能力：三大功能（上移，置于「正在报名」之上，与下方保持间距） */}
      <Reveal>
        <section className="container-page mt-2 pb-24">
          <div className="mb-8 text-center">
            <Tag tone="accent" className="mb-3">
              <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-accent" />
              CORE ENGINE
            </Tag>
            <h2 className="text-2xl font-semibold text-ink sm:text-3xl">
              三步，找到属于你的 AI 机会
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-muted">
              从数据库到个性化匹配，再到 AI 推荐分析，一站式帮你选对比赛
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={i * 90}>
                <Link to={f.href} className="group block h-full">
                  <Card className="corner-frame relative h-full overflow-hidden p-6 transition duration-200 group-hover:-translate-y-1 group-hover:shadow-neon">
                    <div className="mb-4 flex items-center justify-between">
                      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-soft text-accent transition group-hover:scale-105">
                        {f.icon}
                      </span>
                      <span className="font-mono text-2xl font-bold text-line/60">
                        {f.step}
                      </span>
                    </div>
                    <div className="font-semibold text-ink">{f.title}</div>
                    <p className="mt-2 text-sm leading-relaxed text-muted">{f.desc}</p>
                    <div className="mt-4 font-mono text-sm text-accent opacity-0 transition group-hover:opacity-100">
                      前往 →
                    </div>
                  </Card>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>
      </Reveal>

      {/* 正在报名中（高亮区 / LIVE FEED，仅展示仍在报名的比赛） */}
      <Reveal>
        <section className="container-page pb-24">
          <div className="mb-5 flex items-end justify-between gap-3">
            <div>
              <div className="mb-1 flex items-center gap-2 font-mono text-xs tracking-widest text-accent">
                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-accent-warm shadow-neon-warm" />
                LIVE FEED
              </div>
              <h2 className="text-xl font-semibold text-ink">正在报名中</h2>
              <p className="mt-1 text-sm text-muted">
                共 {live.length} 场仍可报名 · 按截止日排序，先报先得
              </p>
            </div>
            <Link
              to="/competitions"
              className="shrink-0 font-mono text-sm text-accent hover:text-glow hover:underline"
            >
              查看全部 →
            </Link>
          </div>

          {all === null ? (
            <div className="py-10 text-center text-sm text-muted">加载中…</div>
          ) : open.length === 0 ? (
            <Card className="corner-frame p-8 text-center text-sm text-muted">
              当前没有正在报名的比赛，去
              <Link to="/competitions" className="mx-1 text-accent hover:underline">
                比赛库
              </Link>
              看看全部 {all.length} 场吧。
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {open.map((c, i) => (
                <Reveal key={c.id} delay={i * 60}>
                  <Link to={`/competitions/${c.id}`}>
                    <Card className="corner-frame flex h-full items-center justify-between gap-3 p-4">
                      <div className="min-w-0">
                        <div className="truncate font-medium text-ink">{c.name}</div>
                        <p className="mt-1 text-xs text-muted">
                          截止 {c.deadline} · 难度 {c.difficulty}
                        </p>
                      </div>
                      <StatusBadge c={c} />
                    </Card>
                  </Link>
                </Reveal>
              ))}
            </div>
          )}
        </section>
      </Reveal>
    </div>
  );
}
