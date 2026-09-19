import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";
import { LinkButton } from "@/components/ui/Button";
import { getCompetitionById } from "@/lib/data-source";
import { useProfileStore } from "@/store/profile-store";
import { trackBehavior } from "@/lib/cloudbase/db";
import { AIRecommendation } from "@/components/recommend/AIRecommendation";
import { StatusBadge } from "@/components/competition/StatusBadge";
import { Reveal } from "@/components/ui/Reveal";
import { REGION_LABEL, SOURCE_LABEL, STATUS_LABEL } from "@/lib/data/taxonomy";
import { reviewCompetition, REVIEW_FIELD_LABELS } from "@/lib/review";
import { tagColor } from "@/lib/tag-color";
import type { Competition } from "@/lib/types";

export default function CompetitionDetail({
  competitionId,
}: {
  competitionId: string;
}) {
  const [c, setC] = useState<Competition | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "missing">(
    "loading"
  );
  const { ensureUserId } = useProfileStore();

  useEffect(() => {
    let active = true;
    setStatus("loading");
    getCompetitionById(competitionId).then((comp) => {
      if (!active) return;
      if (!comp) {
        setStatus("missing");
        return;
      }
      setC(comp);
      setStatus("ready");
      // 行为埋点：浏览详情（确保匿名 ID 存在以便归因）
      trackBehavior(ensureUserId(), competitionId, "view");
    });
    return () => {
      active = false;
    };
  }, [competitionId]);

  if (status === "loading") {
    return (
      <div className="container-page max-w-3xl py-20 text-center text-muted">
        加载中…
      </div>
    );
  }

  if (status === "missing" || !c) {
    return (
      <div className="container-page max-w-3xl py-20 text-center">
        <h1 className="text-2xl font-semibold">未找到该比赛</h1>
        <p className="mt-2 text-muted">比赛可能已下架或链接有误。</p>
        <div className="mt-6 flex justify-center">
          <LinkButton href="/competitions">返回比赛库</LinkButton>
        </div>
      </div>
    );
  }

  return (
    <Reveal>
      <div className="container-page max-w-3xl py-10">
        <Link to="/competitions" className="font-mono text-sm text-muted hover:text-accent">
          ← 返回比赛库
        </Link>

        {/* 标题 + 状态标签 */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <StatusBadge c={c} />
          {c.category && <Tag tone="outline">{c.category}</Tag>}
          {c.aiDirection.map((d) => (
            <Tag key={d} color={tagColor(d)} className="gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
              {d}
            </Tag>
          ))}
          <Tag tone="outline">难度 · {c.difficulty}</Tag>
          <Tag tone="outline">竞争 · {c.competitionLevel}</Tag>
          <Tag tone="outline">{REGION_LABEL[c.region]}</Tag>
          <Tag tone={c.verified ? "default" : "outline"}>
            {c.verified ? "已核实" : "待核实"}
          </Tag>
          {c.source === "community" && (
            <Tag tone="pink">{SOURCE_LABEL[c.source]}</Tag>
          )}
          {c.status !== "approved" && (
            <Tag tone="outline">{STATUS_LABEL[c.status]}</Tag>
          )}
        </div>

        <h1 className="mt-3 text-3xl font-semibold text-ink">{c.name}</h1>
        <p className="mt-2 text-muted">主办：{c.organizer} · 形式：{c.format}</p>

        <div className="mt-3">
          <LinkButton href={`/teammates?c=${c.id}`}>找队友一起打这场比赛 →</LinkButton>
        </div>

        {/* 基础信息 */}
        <Card className="mt-6 p-6">
          <h2 className="mb-3 text-sm font-medium text-muted">基础信息</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="shrink-0 text-muted">比赛名称</dt>
              <dd className="text-right">{c.name}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="shrink-0 text-muted">主办方</dt>
              <dd className="text-right">{c.organizer}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="shrink-0 text-muted">时间</dt>
              <dd className="text-right">{c.time}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="shrink-0 text-muted">报名截止</dt>
              <dd className="text-right">{c.deadline}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="shrink-0 text-muted">报名方式</dt>
              <dd className="text-right">{c.registration ?? "详见官网"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="shrink-0 text-muted">官网</dt>
              <dd className="text-right">
                {c.officialUrl ? (
                  <a
                    href={c.officialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:underline"
                  >
                    前往官网 ↗
                  </a>
                ) : (
                  "暂无"
                )}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="shrink-0 text-muted">报名链接</dt>
              <dd className="text-right">
                {c.registrationUrl ? (
                  <a
                    href={c.registrationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:underline"
                  >
                    前往报名 ↗
                  </a>
                ) : (
                  <span className="text-amber-600">待补充</span>
                )}
              </dd>
            </div>
          </dl>
        </Card>

        {/* 内容完整度（审查机制） */}
        <CompletenessCard competition={c} />

        {/* 标签：AI方向 / 适合人群 / 技能要求 */}
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Card className="p-6">
            <h2 className="mb-3 text-sm font-medium text-muted">AI 方向</h2>
            <div className="flex flex-wrap gap-1.5">
              {c.aiDirection.map((d) => (
                <Tag key={d} color={tagColor(d)} className="gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                  {d}
                </Tag>
              ))}
            </div>
            <h2 className="mb-3 mt-5 text-sm font-medium text-muted">适合人群</h2>
            <div className="flex flex-wrap gap-1.5">
              {c.suitableFor.map((s) => (
                <Tag key={s} tone="default">
                  {s}
                </Tag>
              ))}
            </div>
          </Card>
          <Card className="p-6">
            <h2 className="mb-3 text-sm font-medium text-muted">技能要求</h2>
            <div className="flex flex-wrap gap-1.5">
              {c.skills.map((s) => (
                <Tag key={s} tone="outline">
                  {s}
                </Tag>
              ))}
            </div>
          </Card>
        </div>

      {c.description && (
        <Card className="mt-4 p-6">
          <h2 className="mb-2 text-sm font-medium text-muted">简介</h2>
          <p className="leading-relaxed">{c.description}</p>
        </Card>
      )}

      {c.prizes && (
        <Card className="mt-4 p-6">
          <h2 className="mb-2 text-sm font-medium text-muted">奖项</h2>
          <p>{c.prizes}</p>
        </Card>
      )}

      {/* AI 推荐区域：规则解释（未来可无缝替换为 LLM） */}
      <AIRecommendation competition={c} />
      </div>
    </Reveal>
  );
}

function CompletenessCard({ competition }: { competition: Competition }) {
  const review = reviewCompetition(competition);
  return (
    <Card className="mt-4 p-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted">内容完整度（审查机制）</h2>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
            review.complete
              ? "bg-emerald-100 text-emerald-700"
              : "bg-amber-100 text-amber-700"
          }`}
        >
          {review.complete ? "已通过" : `待完善 ${review.completeness}%`}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {(Object.keys(REVIEW_FIELD_LABELS) as string[]).map((key) => {
          const ok = review.fieldStatus[key];
          return (
            <div
              key={key}
              className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-xs ${
                ok
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-amber-50 text-amber-700"
              }`}
            >
              <span>{ok ? "✓" : "✗"}</span>
              <span>{REVIEW_FIELD_LABELS[key]}</span>
            </div>
          );
        })}
      </div>
      {!review.complete && (
        <p className="mt-3 text-xs text-muted">
          缺失项：{review.missingLabels.join("、")}（投稿或编辑时补充即可通过审查）
        </p>
      )}
    </Card>
  );
}
