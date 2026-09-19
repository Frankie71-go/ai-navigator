import { Link } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";
import { LinkButton } from "@/components/ui/Button";
import { StatusBadge } from "@/components/competition/StatusBadge";
import { Reveal } from "@/components/ui/Reveal";
import { useProfileStore } from "@/store/profile-store";
import { trackBehavior } from "@/lib/cloudbase/db";
import { REGION_LABEL } from "@/lib/data/taxonomy";
import { reviewCompetition } from "@/lib/review";
import { tagColor } from "@/lib/tag-color";
import type { Competition } from "@/lib/types";

export function CompetitionCard({
  c,
  className = "",
  index = 0,
}: {
  c: Competition;
  className?: string;
  index?: number;
}) {
  const ensureUserId = useProfileStore((s) => s.ensureUserId);
  const review = reviewCompetition(c);

  const onClick = () => {
    const id = ensureUserId(); // 确保匿名 ID 存在，行为可归因
    trackBehavior(id, c.id, "click");
  };

  return (
    <Reveal className={className} delay={Math.min(index, 9) * 60}>
      <Card className="flex h-full flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <Link
            to={`/competitions/${c.id}`}
            onClick={onClick}
            className="font-semibold leading-snug hover:text-accent-warm"
          >
            {c.name}
          </Link>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <StatusBadge c={c} />
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                review.complete
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-amber-100 text-amber-700"
              }`}
              title={
                review.complete
                  ? "必填信息已完整"
                  : `待完善：${review.missingLabels.join("、")}`
              }
            >
              {review.complete ? "内容完整" : `待完善 ${review.completeness}%`}
            </span>
            <Tag tone="outline">{REGION_LABEL[c.region]}</Tag>
            <Tag tone="outline">竞争 · {c.competitionLevel}</Tag>
          </div>
        </div>

        {c.tags.includes("总网站") && (
          <div className="rounded-md border border-amber-300 bg-amber-100 px-2.5 py-1.5 text-[11px] leading-relaxed text-amber-800">
            总网站 · 内含多个赛项，请自行到平台内查看具体比赛
          </div>
        )}

        <div>
          <p className="mb-1 text-xs font-medium text-muted">AI 方向</p>
          <div className="flex flex-wrap gap-1.5">
            {c.aiDirection.map((d) => (
              <Tag key={d} color={tagColor(d)} className="gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                {d}
              </Tag>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-1 text-xs font-medium text-muted">适合人群</p>
          <div className="flex flex-wrap gap-1.5">
            {c.suitableFor.map((s) => (
              <Tag key={s} tone="default">
                {s}
              </Tag>
            ))}
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <span className="truncate text-xs text-muted">
            {c.organizer} · 截止 {c.deadline}
          </span>
          <LinkButton
            href={`/competitions/${c.id}`}
            variant="secondary"
            onClick={onClick}
            className="whitespace-nowrap"
          >
            查看详情 →
          </LinkButton>
        </div>
      </Card>
    </Reveal>
  );
}
