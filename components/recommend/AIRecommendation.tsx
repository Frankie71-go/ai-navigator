"use client";

import { useEffect, useState } from "react";
import { useProfileStore } from "@/store/profile-store";
import { scoreMatch } from "@/lib/recommend/engine";
import {
  generateExplanation,
  type MatchExplanation,
} from "@/lib/recommend/explain";
import type { Competition } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";

export function AIRecommendation({ competition }: { competition: Competition }) {
  const { profile } = useProfileStore();
  const skillsAny = Object.values(profile.skillRatings).some((v) => v > 0);
  const filled =
    profile.identity ||
    profile.major ||
    profile.aiLevel ||
    skillsAny ||
    profile.goals.length;

  const [exp, setExp] = useState<MatchExplanation | null>(null);

  useEffect(() => {
    if (!filled) {
      setExp(null);
      return;
    }
    let active = true;
    (async () => {
      const match = scoreMatch(profile, competition);
      const explanation = await generateExplanation({
        profile,
        competition,
        match,
      });
      if (active) setExp(explanation);
    })();
    return () => {
      active = false;
    };
  }, [filled, profile, competition]);

  // —— 无画像：引导填写 ——
  if (!filled) {
    return (
      <Card className="mt-4 border border-accent/40 bg-accent-soft p-6">
        <div className="mb-1 flex items-center gap-2">
          <span className="text-xs font-medium text-accent">AI 推荐分析</span>
          <span className="rounded-full bg-panel px-2 py-0.5 font-mono text-[11px] text-muted">
            预览
          </span>
        </div>
        <h2 className="text-base font-semibold">为什么推荐给你？</h2>
        <p className="mt-3 text-sm text-muted">
          完善你的画像后，这里会显示基于你背景、技能与目标的个性化推荐理由。
        </p>
        <div className="mt-4">
          <LinkButton href="/profile" variant="secondary">
            去填写画像 →
          </LinkButton>
        </div>
      </Card>
    );
  }

  // —— 有画像：真实解释（规则 mock，未来接 LLM） ——
  return (
    <Card className="mt-4 border border-accent/40 bg-accent-soft p-6">
      <div className="mb-1 flex items-center gap-2">
        <span className="text-xs font-medium text-accent">AI 推荐分析</span>
        <span className="rounded-full bg-line/50 px-2 py-0.5 text-[11px] text-muted">预览</span>
      </div>
      <h2 className="text-base font-semibold">为什么推荐给你？</h2>
      <p className="mt-3 text-sm font-medium text-ink">{exp?.why}</p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-medium text-muted">优势</p>
          <ul className="space-y-1 text-sm text-ink">
            {(exp?.strengths ?? []).map((s, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-accent">+</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-2 text-xs font-medium text-muted">需要注意</p>
          <ul className="space-y-1 text-sm text-muted">
            {(exp?.cautions ?? []).map((s, i) => (
              <li key={i} className="flex gap-2">
                <span>!</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-4">
        <LinkButton href="/recommend" variant="secondary">
          查看我的完整推荐 →
        </LinkButton>
      </div>
    </Card>
  );
}
