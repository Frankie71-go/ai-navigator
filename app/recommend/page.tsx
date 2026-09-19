import { useEffect, useMemo, useState, useRef } from "react";
import { useProfileStore } from "@/store/profile-store";
import { getCompetitions } from "@/lib/data-source";
import { recommend } from "@/lib/recommend/engine";
import { hasCalibrationEvidence } from "@/lib/skill-calibration";
import { trackBehavior } from "@/lib/cloudbase/db";
import {
  generateExplanation,
  type MatchExplanation,
} from "@/lib/recommend/explain";
import { RecommendCard } from "@/components/recommend/RecommendCard";
import { LinkButton } from "@/components/ui/Button";
import { PageHeader } from "@/components/layout/PageHeader";
import { Reveal } from "@/components/ui/Reveal";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import type { Competition } from "@/lib/types";

const SECTIONS = [
  { key: "best", title: "最适合你的", desc: "与你的背景、技能、目标最契合，优先投入", accent: "accent" },
  { key: "challenge", title: "挑战型", desc: "匹配度不低，但难度高于你当前水平，是值得挑战的成长机会", accent: "accent2" },
  { key: "explore", title: "探索型", desc: "与你的兴趣相关、匹配略低，适合开阔视野、跨出舒适区", accent: "accent3" },
] as const;

const SECTION_BORDER: Record<string, string> = {
  accent: "border-accent",
  accent2: "border-accent2",
  accent3: "border-accent3",
};

export default function RecommendPage() {
  const { profile } = useProfileStore();
  const skillsSum = Object.values(profile.skillRatings).reduce((a, b) => a + b, 0);
  const filled =
    profile.identity ||
    profile.major ||
    profile.aiLevel ||
    skillsSum > 0 ||
    profile.goals.length ||
    (profile.aiDirection?.length ?? 0) > 0 ||
    (profile.experiences?.length ?? 0) > 0 ||
    (profile.personality?.length ?? 0) > 0 ||
    !!profile.bio ||
    !!profile.availability;

  const [comps, setComps] = useState<Competition[]>([]);
  const [loaded, setLoaded] = useState(false);

  const calibrationOn = useMemo(
    () => (loaded ? hasCalibrationEvidence(comps) : false),
    [loaded, comps]
  );

  useEffect(() => {
    let active = true;
    getCompetitions().then((cs) => {
      if (active) {
        // 未审核（自动采集待定）的比赛不进入推荐，避免把待定内容推给用户
        setComps(cs.filter((c) => c.status !== "pending"));
        setLoaded(true);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const result = useMemo(
    () => (filled && loaded ? recommend(profile, comps) : null),
    [filled, loaded, profile, comps]
  );

  // 行为埋点：查看推荐结果（结果就绪时记录一次，归因到 Top1 比赛）
  const trackedRef = useRef(false);
  useEffect(() => {
    if (!result || trackedRef.current) return;
    trackedRef.current = true;
    const id = useProfileStore.getState().ensureUserId();
    const top =
      result.best[0]?.competition.id ??
      result.challenge[0]?.competition.id ??
      result.explore[0]?.competition.id ??
      "";
    trackBehavior(id, top, "recommend_view", {
      count: result.best.length + result.challenge.length + result.explore.length,
    });
  }, [result]);

  // —— AI 解释（异步接口，未来可无缝换成 LLM） ——
  const [explanations, setExplanations] = useState<Record<string, MatchExplanation>>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!result) return;
    let active = true;
    const items = [...result.best, ...result.challenge, ...result.explore];
    const total = items.length;
    (async () => {
      const map: Record<string, MatchExplanation> = {};
      await Promise.all(
        items.map(async (it) => {
          map[it.competition.id] = await generateExplanation({
            profile,
            competition: it.competition,
            match: it,
          });
        })
      );
      if (active) {
        setExplanations(map);
        setReady(total === 0 ? true : Object.keys(map).length === total);
      }
    })();
    return () => {
      active = false;
    };
  }, [result, profile]);

  if (!filled) {
    return (
      <div className="container-page max-w-xl py-20 text-center">
        <div className="mb-3 font-mono text-xs tracking-widest text-accent">RECOMMEND</div>
        <h1 className="text-2xl font-semibold text-ink">还没有你的画像</h1>
        <p className="mt-2 text-muted">
          在「我的画像」里<strong className="text-ink">至少填一项</strong>就会立刻出推荐：
        </p>
        <p className="mt-1 text-sm text-muted">
          身份 / 专业 / AI 水平 / 技能评分 / 想做的 AI 方向 / 参加目标 / 项目经历 / 人格特质 / 一句话简介
        </p>
        <div className="mt-6 flex justify-center">
          <LinkButton href="/profile">去填写画像</LinkButton>
        </div>
      </div>
    );
  }

  if (!loaded) {
    return (
      <div className="container-page py-20 text-center font-mono text-sm text-muted">
        正在加载比赛数据…
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="container-page py-20 text-center font-mono text-sm text-muted">
        正在生成推荐解释…
      </div>
    );
  }

  if (!result) return null;

  return (
    <ErrorBoundary fallbackTitle="推荐页加载出错了">
    <Reveal>
      <div className="container-page py-10">
        <PageHeader
          eyebrow="RECOMMEND"
          title="为你推荐"
          subtitle="基于你的画像与本地行为生成 · 匹配度 0–100（越高越对口）"
        />

      {/* 匹配度 / 三档图例 */}
      <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-card border border-line bg-panel/60 px-4 py-3 text-xs text-muted">
        <span>匹配度 0–100，越高越对口</span>
        <span className="inline-flex items-center gap-1.5 text-accent">
          <span className="h-2.5 w-2.5 rounded-sm bg-accent" /> 最适合
        </span>
        <span className="inline-flex items-center gap-1.5 text-accent2">
          <span className="h-2.5 w-2.5 rounded-sm bg-accent2" /> 挑战型
        </span>
        <span className="inline-flex items-center gap-1.5 text-accent3">
          <span className="h-2.5 w-2.5 rounded-sm bg-accent3" /> 探索型
        </span>
      </div>

      {/* 技能评分校准提示 */}
      <div
        className={`mt-3 rounded-card border px-4 py-2 text-xs ${
          calibrationOn
            ? "border-accent/40 bg-accent-soft/50 text-ink"
            : "border-line bg-panel/40 text-muted"
        }`}
      >
        {calibrationOn
          ? "技能评分已结合你的浏览 / 搜索行为校准，减少纯自评带来的偏差。"
          : "提示：补全技能自评，或浏览 / 收藏更多比赛，可启用「行为校准」让推荐更客观。"}
      </div>

      <div className="mt-8 space-y-10">
        {SECTIONS.map(({ key, title, desc }) => {
          const items = result[key];
          if (!items.length) return null;
          return (
            <section key={key}>
              <div className={`mb-4 border-l-2 ${SECTION_BORDER[key]} pl-3`}>
                <h2 className="text-lg font-semibold text-ink">{title}</h2>
                <p className="text-sm text-muted">{desc}</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((it, i) => (
                  <Reveal key={it.competition.id} delay={i * 60} className="h-full">
                    <RecommendCard
                      competition={it.competition}
                      score={it.total}
                      explanation={explanations[it.competition.id]}
                    />
                  </Reveal>
                ))}
              </div>
            </section>
          );
        }        )}
      </div>
      </div>
    </Reveal>
    </ErrorBoundary>
  );
}
