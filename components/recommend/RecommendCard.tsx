import { Link } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";
import { LinkButton } from "@/components/ui/Button";
import type { Competition } from "@/lib/types";
import type { MatchExplanation } from "@/lib/recommend/explain";

export function RecommendCard({
  competition,
  score,
  explanation,
}: {
  competition: Competition;
  score: number;
  explanation: MatchExplanation;
}) {
  const { id, name, description } = competition;
  const pct = Math.max(0, Math.min(100, score));
  return (
    <Card className="flex flex-col gap-3 p-5">
      <div className="flex items-start justify-between gap-3">
        <Link to={`/competitions/${id}`} className="font-semibold hover:text-accent">
          {name}
        </Link>
        <Tag tone="accent">匹配度 {score}/100</Tag>
      </div>

      {/* 匹配度进度条 */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-line/70">
        <div
          className="h-full rounded-full bg-gradient-to-r from-accent3 via-accent to-accent2"
          style={{ width: `${pct}%` }}
        />
      </div>

      <p className="text-sm font-medium text-ink">{explanation.why}</p>

      {description && <p className="line-clamp-2 text-xs text-muted">{description}</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-1 text-xs font-medium text-muted">优势</p>
          <ul className="space-y-1 text-sm text-ink">
            {explanation.strengths.map((s, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-accent">+</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-1 text-xs font-medium text-muted">需要注意</p>
          <ul className="space-y-1 text-sm text-muted">
            {explanation.cautions.map((s, i) => (
              <li key={i} className="flex gap-2">
                <span>!</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="pt-1">
        <LinkButton
          href={`/competitions/${id}`}
          variant="secondary"
          className="whitespace-nowrap"
        >
          查看详情 →
        </LinkButton>
      </div>
    </Card>
  );
}
