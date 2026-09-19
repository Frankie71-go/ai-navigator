"use client";

import { useEffect, useState } from "react";
import type { UserProfile } from "@/lib/types";
import {
  verifySkills,
  type VerificationReport,
  type Verdict,
} from "@/lib/skill-verify";

const VERDICT_META: Record<Verdict, { label: string; cls: string }> = {
  verified: { label: "已验证", cls: "border border-accent/50 bg-accent/10 text-accent" },
  partial: { label: "潜力未体现", cls: "border border-accent3/50 bg-accent3/10 text-accent3" },
  unverified: { label: "未验证", cls: "border border-line text-muted" },
  overclaimed: { label: "疑似高估", cls: "border border-rose-300 bg-rose-50 text-rose-600" },
  no_self: { label: "未自评", cls: "border border-line text-muted" },
};

export function SkillReviewPanel({ profile }: { profile: UserProfile }) {
  const [report, setReport] = useState<VerificationReport | null>(null);

  useEffect(() => {
    let alive = true;
    verifySkills(profile).then((r) => {
      if (alive) setReport(r);
    });
    return () => {
      alive = false;
    };
  }, [profile]);

  if (!report) return null;

  return (
    <div className="rounded-card border border-line bg-panel/60 p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <span className="font-mono text-xs text-accent">AI</span>技能审查
          <span
            className={`rounded-full px-2 py-0.5 font-mono text-[10px] ${
              report.engine === "cloud"
                ? "border border-accent2/50 bg-accent2/10 text-accent2"
                : "border border-line text-muted"
            }`}
          >
            {report.engine === "cloud" ? "云端大模型（腾讯云）" : "本地规则"}
          </span>
        </h3>
        {report.hasEvidence && (
          <span className="font-mono text-[11px] text-muted">
            可信度 {Math.round(report.confidence * 100)}%
          </span>
        )}
      </div>

      {!report.hasEvidence ? (
        <p className="text-xs text-muted">
          尚未填写任何项目经历，技能仍为纯自评、无法验证。在上方添加经历后，这里会自动给出审查结果。
        </p>
      ) : (
        <>
          <ul className="space-y-2.5">
            {report.perSkill.map((s) => {
              const meta = VERDICT_META[s.verdict];
              return (
                <li key={s.dim} className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="w-16 shrink-0 text-sm">{s.label}</span>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-mono text-[11px] font-medium ${meta.cls}`}
                    >
                      {meta.label}
                    </span>
                    <span className="font-mono text-[11px] text-muted">
                      自评 {s.self}/5 · 经历支撑约 {s.expectation}/5
                    </span>
                  </div>
                  <p className="pl-[4.5rem] text-xs text-muted">{s.reason}</p>
                </li>
              );
            })}
          </ul>

          {report.confidence > 0 && (
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-line/60">
              <div
                className="h-full rounded-full bg-accent"
                style={{ width: `${Math.round(report.confidence * 100)}%` }}
              />
            </div>
          )}

          <p className="mt-3 text-xs leading-relaxed text-ink/80">{report.overall}</p>
        </>
      )}
    </div>
  );
}
